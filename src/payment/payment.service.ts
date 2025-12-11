// backend\src\payment\payment.service.ts
// backend\src\payment\payment.service.ts
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as crypto from 'crypto';
import { Payment, PaymentStatus, PaymentMethod, PaymentGateway } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { Invoice } from './entities/invoice.entity';
import { Order } from '../order/entities/order.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { RoomBooking } from '../room/entities/room-booking.entity';
import { User } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/entities/user.types';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

// Paystack response interfaces
interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    paid_at: string;
    channel: string;
    gateway_response: string;
    metadata: any;
    customer: {
      email: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data?: any;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly paystackSecretKey: string;
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(RoomBooking)
    private roomBookingRepository: Repository<RoomBooking>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private dataSource: DataSource,
  ) {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
    if (!this.paystackSecretKey) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured');
      throw new Error('PAYSTACK_SECRET_KEY is required');
    }
  }

  // Helper method to check payment access
  private async checkPaymentAccess(user: User, paymentId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user', 'order', 'reservation', 'roomBooking'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }
    // Admin has access to all payments
    if (user.role.name === UserRoleEnum.ADMIN) {
      return payment;
    }
    // Customers can only access their own payments
    if (user.role.name === UserRoleEnum.CUSTOMER && payment.user_id !== user.id) {
      throw new ForbiddenException('You can only access your own payments');
    }
    // Restaurant owners can only access payments for their restaurant
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const hasAccess = await this.checkRestaurantPaymentAccess(user, payment);
      if (!hasAccess) {
        throw new ForbiddenException('You can only access payments for your restaurant');
      }
    }
    return payment;
  }

  // Helper method to check restaurant payment access
  private async checkRestaurantPaymentAccess(user: User, payment: Payment): Promise<boolean> {
    // Check if payment is for an order from user's restaurant
    if (payment.order) {
      const order = await this.orderRepository.findOne({
        where: { id: payment.order.id },
        relations: ['restaurant', 'restaurant.owner'],
      });
      if (order && String(order.restaurant.owner.id) === String(user.id)) {
        return true;
      }
    }
    // Check if payment is for a reservation from user's restaurant
    if (payment.reservation) {
      const reservation = await this.reservationRepository.findOne({
        where: { id: payment.reservation.id },
        relations: ['restaurant', 'restaurant.owner'],
      });
      if (reservation && String(reservation.restaurant.owner.id) === String(user.id)) {
        return true;
      }
    }
    return false;
  }

  // Helper method to get user's restaurant ID
  private async getUserRestaurantId(user: User): Promise<number> {
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { owner: { id: user.id } },
      });
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found for this user');
      }
      return Number(restaurant.id);
    }
    throw new ForbiddenException('User does not have restaurant access');
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(createPaymentDto: CreatePaymentDto, user?: User): Promise<any> {
    this.logger.log('=== PAYMENT INITIALIZATION STARTED ===');
    this.logger.log('Input DTO:', JSON.stringify(createPaymentDto, null, 2));
    this.logger.log('Authenticated User:', user ? `ID: ${user.id}, Role: ${user.role.name}` : 'None');

    // Check permissions for creating payments
    if (user) {
      // Customers can only create payments for themselves
      if (
        user.role.name === UserRoleEnum.CUSTOMER &&
        Number(createPaymentDto.userId) !== user.id
      ) {
        throw new ForbiddenException('You can only create payments for yourself');
      }
    }

    // Ensure userId is set - either from DTO or from authenticated user
    const userId = createPaymentDto.userId || user?.id;
    if (!userId) {
      this.logger.error('User ID is missing - cannot proceed with payment');
      throw new BadRequestException('User ID is required for payment');
    }
    this.logger.log(`Using User ID: ${userId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      this.logger.log('Starting transaction and validation...');
      // Validate the related entity exists
      try {
        await this.validatePaymentEntity(createPaymentDto);
        this.logger.log('Entity validation passed');
      } catch (validationError) {
        this.logger.error('Entity validation failed:', validationError.message);
        throw validationError;
      }

      // Generate unique reference
      const reference = `RMS_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
      const paymentNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      this.logger.log(`Generated reference: ${reference}`);
      this.logger.log(`Generated payment number: ${paymentNumber}`);

      // Prepare payment data for Paystack
      const paymentData = {
        email: createPaymentDto.customerEmail,
        amount: Math.round(createPaymentDto.amount * 100), // Convert to kobo (smallest currency unit)
        reference,
        currency: createPaymentDto.currency || 'KES',
        channels: this.getChannels(createPaymentDto.method),
        metadata: {
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: createPaymentDto.customerName,
            },
            ...(createPaymentDto.orderId
              ? [
                  {
                    display_name: 'Order ID',
                    variable_name: 'order_id',
                    value: createPaymentDto.orderId,
                  },
                ]
              : []),
            ...(createPaymentDto.reservationId
              ? [
                  {
                    display_name: 'Reservation ID',
                    variable_name: 'reservation_id',
                    value: createPaymentDto.reservationId,
                  },
                ]
              : []),
            ...(createPaymentDto.roomBookingId
              ? [
                  {
                    display_name: 'Room Booking ID',
                    variable_name: 'room_booking_id',
                    value: createPaymentDto.roomBookingId,
                  },
                ]
              : []),
          ],
          payment_type: this.getPaymentType(createPaymentDto),
        },
        callback_url:
          createPaymentDto.callbackUrl ||
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/callback`,
      };

      this.logger.log('Paystack payment data:', JSON.stringify({
        email: paymentData.email,
        amount: paymentData.amount,
        reference: paymentData.reference,
        currency: paymentData.currency,
        channels: paymentData.channels,
        callback_url: paymentData.callback_url,
        metadata: paymentData.metadata
      }, null, 2));

      this.logger.log(`Paystack API URL: ${this.paystackBaseUrl}/transaction/initialize`);
      this.logger.log(`Using Paystack Secret Key: ${this.paystackSecretKey ? '***REDACTED***' : 'NOT SET'}`);
      this.logger.log(`Callback URL: ${paymentData.callback_url}`);

      if (!this.paystackSecretKey) {
        this.logger.error('PAYSTACK_SECRET_KEY is not configured!');
        throw new HttpException('Payment service is not properly configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Call Paystack API to initialize transaction
      this.logger.log('Calling Paystack API...');
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('Paystack API response status:', response.status);
      this.logger.log('Paystack API response data:', JSON.stringify(response.data, null, 2));

      if (!response.data.status) {
        this.logger.error('Paystack API returned error:', response.data.message);
        throw new HttpException(
          response.data.message || 'Failed to initialize payment',
          HttpStatus.BAD_REQUEST,
        );
      }

      const paystackResponse = response.data;

      // Create payment record in database
      this.logger.log('Creating payment record in database...');
      // Simplify metadata to avoid SQL Server issues
      const simplifiedMetadata = {
        customerName: createPaymentDto.customerName,
        paymentType: this.getPaymentType(createPaymentDto),
        ...(createPaymentDto.orderId ? { orderId: createPaymentDto.orderId } : {}),
        ...(createPaymentDto.reservationId ? { reservationId: createPaymentDto.reservationId } : {}),
        ...(createPaymentDto.roomBookingId ? { roomBookingId: createPaymentDto.roomBookingId } : {})
      };
      this.logger.log('Simplified metadata:', JSON.stringify(simplifiedMetadata, null, 2));

      // Validate metadata length before saving
      const metadataString = JSON.stringify(simplifiedMetadata);
      const maxMetadataLength = 2000; // Match database column limit
      if (metadataString.length > maxMetadataLength) {
        this.logger.error(`Metadata exceeds maximum length: ${metadataString.length}/${maxMetadataLength}`);
        throw new HttpException(
          `Payment metadata is too large (${metadataString.length} characters). Maximum allowed is ${maxMetadataLength} characters.`,
          HttpStatus.BAD_REQUEST
        );
      }

      const payment = queryRunner.manager.create(Payment, {
        payment_number: paymentNumber,
        user_id: userId, // Use the resolved userId
        user: { id: userId }, // Set relation
        order: createPaymentDto.orderId ? { id: createPaymentDto.orderId } : undefined,
        reservation: createPaymentDto.reservationId ? { id: createPaymentDto.reservationId } : undefined,
        roomBooking: createPaymentDto.roomBookingId ? { id: createPaymentDto.roomBookingId } : undefined,
        email: createPaymentDto.customerEmail,
        authorization_url: paystackResponse.data.authorization_url,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'KES',
        payment_method: createPaymentDto.method as PaymentMethod,
        gateway: PaymentGateway.PAYSTACK,
        payment_reference: reference,
        status: PaymentStatus.PENDING,
        callback_url: paymentData.callback_url,
        metadata: metadataString,
      });

      await queryRunner.manager.save(payment);
      this.logger.log(`Payment record created with ID: ${payment.id}`);

      // Commit transaction
      await queryRunner.commitTransaction();
      this.logger.log('Transaction committed successfully');
      this.logger.log(`Payment initialized successfully: ${reference}`);

      return {
        success: true,
        message: 'Payment initialized successfully',
        data: {
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          reference: paystackResponse.data.reference,
          paymentId: payment.id,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to initialize payment', error.stack);
      // Provide more detailed error information
      let errorMessage = 'Failed to initialize payment';
      let statusCode = HttpStatus.BAD_REQUEST;
      if (error.response) {
        // Axios error from Paystack API
        errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
        statusCode = error.response.status || HttpStatus.BAD_REQUEST;
        this.logger.error('Paystack API Error:', error.response.data);
      } else if (error instanceof HttpException || error instanceof ForbiddenException) {
        this.logger.error('HTTP Exception:', error.message);
        throw error;
      } else if (error.message) {
        errorMessage = error.message;
        this.logger.error('General Error:', errorMessage);
      }
      this.logger.error('Final error response:', {
        message: errorMessage,
        statusCode: statusCode
      });
      throw new HttpException(
        {
          success: false,
          message: errorMessage,
          details: error.response?.data || error.stack || 'No additional details'
        },
        statusCode,
      );
    } finally {
      await queryRunner.release();
      this.logger.log('Database connection released');
      this.logger.log('=== PAYMENT INITIALIZATION COMPLETED ===');
    }
  }

  /**
   * Verify payment status with Paystack
   */
  async verifyPayment(verifyPaymentDto: VerifyPaymentDto, user?: User): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { reference } = verifyPaymentDto;
      // Find payment record
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { payment_reference: reference },
        relations: ['user', 'order', 'reservation', 'roomBooking'],
      });
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Check access permissions
      if (user) {
        await this.checkPaymentAccess(user, Number(payment.id));
      }

      // If already processed, return current status
      if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
        await queryRunner.rollbackTransaction();
        return {
          success: payment.status === PaymentStatus.SUCCESS,
          message: `Payment already ${payment.status}`,
          data: {
            status: payment.status,
            paymentId: payment.id,
            amount: payment.amount,
            paidAt: payment.paid_at,
          },
        };
      }

      // Call Paystack verification API
      const response = await axios.get<PaystackVerificationResponse>(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        },
      );
      const verificationData = response.data;

      if (!verificationData.status) {
        throw new HttpException(
          verificationData.message || 'Verification failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update payment status based on verification
      if (verificationData.data.status === 'success') {
        payment.status = PaymentStatus.SUCCESS;
        payment.paid_at = new Date(verificationData.data.paid_at);
        payment.channel = verificationData.data.channel;
        payment.gateway_response = JSON.stringify(verificationData.data.gateway_response);
        payment.metadata = JSON.stringify(verificationData.data.metadata);
        payment.transaction_id = verificationData.data.reference;
        payment.gateway_reference = verificationData.data.reference;
        await queryRunner.manager.save(payment);

        // Create invoice
        await this.createInvoiceWithTransaction(payment, queryRunner);

        // Update related entity status
        await this.updateRelatedEntityStatus(payment, queryRunner);
        this.logger.log(`Payment verified successfully: ${reference}`);
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.gateway_response = JSON.stringify(verificationData.data.gateway_response);
        payment.failed_at = new Date();
        await queryRunner.manager.save(payment);
        this.logger.warn(`Payment verification failed: ${reference}`);
      }

      // Commit transaction
      await queryRunner.commitTransaction();
      return {
        success: payment.status === PaymentStatus.SUCCESS,
        message:
          payment.status === PaymentStatus.SUCCESS
            ? 'Payment verified successfully'
            : 'Payment verification failed',
        data: {
          status: payment.status,
          paymentId: payment.id,
          amount: payment.amount,
          paidAt: payment.paid_at,
          reference: payment.payment_reference,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to verify payment', error.stack);
      if (error instanceof HttpException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new HttpException(
        error.response?.data?.message || 'Failed to verify payment',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle Paystack webhook events
   */
  async handleWebhook(paystackWebhookDto: PaystackWebhookDto, signature: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Verify webhook signature
      this.verifyWebhookSignature(JSON.stringify(paystackWebhookDto), signature);
      const { event, data } = paystackWebhookDto;
      this.logger.log(`Received webhook event: ${event} for reference: ${data.reference}`);
      // Handle different webhook events
      switch (event) {
        case 'charge.success':
          await this.handleChargeSuccess(data, queryRunner);
          break;
        case 'charge.failed':
          await this.handleChargeFailed(data, queryRunner);
          break;
        case 'transfer.success':
        case 'transfer.failed':
          this.logger.log(`Transfer event received: ${event}`);
          break;
        default:
          this.logger.warn(`Unhandled webhook event: ${event}`);
      }
      await queryRunner.commitTransaction();
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Webhook processing failed', error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle successful charge webhook
   */
  private async handleChargeSuccess(data: any, queryRunner: any) {
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { payment_reference: data.reference },
      relations: ['user', 'order', 'reservation', 'roomBooking'],
    });
    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${data.reference}`);
      return;
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.log(`Payment already processed: ${data.reference}`);
      return;
    }
    // Update payment to success
    payment.status = PaymentStatus.SUCCESS;
    payment.paid_at = new Date(data.paid_at);
    payment.channel = data.channel;
    payment.gateway_response = JSON.stringify(data.gateway_response);
    payment.metadata = JSON.stringify(data.metadata);
    payment.transaction_id = data.reference;
    payment.gateway_reference = data.reference;
    await queryRunner.manager.save(payment);
    // Create invoice
    await this.createInvoiceWithTransaction(payment, queryRunner);
    // Update related entity
    await this.updateRelatedEntityStatus(payment, queryRunner);
    this.logger.log(`Payment ${data.reference} completed successfully via webhook`);
  }

  /**
   * Handle failed charge webhook
   */
  private async handleChargeFailed(data: any, queryRunner: any) {
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { payment_reference: data.reference },
    });
    if (payment && payment.status === PaymentStatus.PENDING) {
      payment.status = PaymentStatus.FAILED;
      payment.gateway_response = JSON.stringify(data.gateway_response || 'Payment failed');
      payment.failed_at = new Date();
      await queryRunner.manager.save(payment);
      this.logger.warn(`Payment failed: ${data.reference}`);
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string): void {
    const hash = crypto.createHmac('sha512', this.paystackSecretKey).update(payload).digest('hex');
    if (hash !== signature) {
      throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Create invoice with transaction - FIXED VERSION
   */
  private async createInvoiceWithTransaction(payment: Payment, queryRunner: any) {
    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
   
    this.logger.log(`Creating invoice for payment ${payment.id} with number: ${invoiceNumber}`);
   
    // Fixed: Create invoice instance and set properties directly (not via create() to avoid mapping issues)
    const invoice = new Invoice();
    invoice.paymentId = payment.id; // Direct foreign key assignment (now matches int type)
    invoice.invoiceNumber = invoiceNumber; // Required field - explicitly set
    invoice.issuedAt = new Date();
    invoice.sentAt = new Date(); // Set to now (nullable, but we set it)
    invoice.pdfUrl = ''; // Empty string for nullable field
   
    try {
      const savedInvoice = await queryRunner.manager.save(invoice);
      this.logger.log(`✓ Invoice created successfully: ${invoiceNumber} for payment ${payment.id} (ID: ${savedInvoice.id})`);
      return savedInvoice;
    } catch (error) {
      this.logger.error(`✗ Failed to create invoice for payment ${payment.id}:`, error.message);
      this.logger.error('Invoice data being saved:', {
        paymentId: payment.id,
        invoiceNumber,
        issuedAt: invoice.issuedAt,
        sentAt: invoice.sentAt,
        pdfUrl: invoice.pdfUrl
      });
      throw new HttpException(
        `Failed to create invoice: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update related entity status after successful payment
   */
  private async updateRelatedEntityStatus(payment: Payment, queryRunner: any) {
    try {
      if (payment.order) {
        const order = await queryRunner.manager.findOne(Order, {
          where: { id: payment.order.id },
        });
        if (order) {
          order.status = 'paid'; // Adjust based on your Order entity status field
          await queryRunner.manager.save(order);
          this.logger.log(`Order ${String(payment.order.id)} marked as paid`);
        }
      }
      if (payment.reservation) {
        const reservation = await queryRunner.manager.findOne(Reservation, {
          where: { id: payment.reservation.id },
        });
        if (reservation) {
          reservation.status = 'confirmed'; // Adjust based on your Reservation entity
          await queryRunner.manager.save(reservation);
          this.logger.log(`Reservation ${String(payment.reservation.id)} confirmed`);
        }
      }
      if (payment.roomBooking) {
        const roomBooking = await queryRunner.manager.findOne(RoomBooking, {
          where: { id: payment.roomBooking.id },
        });
        if (roomBooking) {
          roomBooking.status = 'confirmed'; // Adjust based on your RoomBooking entity
          await queryRunner.manager.save(roomBooking);
          this.logger.log(`Room booking ${String(payment.roomBooking.id)} confirmed`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to update related entity status', error.stack);
      // Don't throw - payment is successful, this is supplementary
    }
  }

  /**
   * Validate that the payment entity exists
   */
  private async validatePaymentEntity(createPaymentDto: CreatePaymentDto) {
    if (createPaymentDto.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: Number(createPaymentDto.orderId) },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
    }
    if (createPaymentDto.reservationId) {
      const reservation = await this.reservationRepository.findOne({
        where: { id: createPaymentDto.reservationId },
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }
    }
    if (createPaymentDto.roomBookingId) {
      const roomBooking = await this.roomBookingRepository.findOne({
        where: { id: Number(createPaymentDto.roomBookingId) },
      });
      if (!roomBooking) {
        throw new NotFoundException('Room booking not found');
      }
    }
    if (createPaymentDto.userId) {
      const user = await this.dataSource.getRepository(User).findOne({
        where: { id: Number(createPaymentDto.userId) },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }
  }

  /**
   * Get payment channels based on method
   */
  private getChannels(method: string): string[] {
    const channelMap: Record<string, string[]> = {
      card: ['card'],
      bank: ['bank'],
      ussd: ['ussd'],
      mobile_money: ['mobile_money', 'mpesa', 'airtel', 'orange', 'vodafone'],
      bank_transfer: ['bank_transfer'],
      mpesa: ['mpesa'],
      airtel: ['airtel'],
      orange: ['orange'],
      vodafone: ['vodafone'],
    };
    return (
      channelMap[method] || ['card', 'bank', 'ussd', 'mobile_money', 'mpesa', 'airtel', 'orange', 'vodafone']
    );
  }

  /**
   * Determine payment type from DTO
   */
  private getPaymentType(dto: CreatePaymentDto): string {
    if (dto.orderId) return 'order';
    if (dto.reservationId) return 'reservation';
    if (dto.roomBookingId) return 'room_booking';
    return 'general';
  }

  // ========== CRUD Operations ==========
  async findAll(user?: User): Promise<Payment[]> {
    // Only admin can access all payments
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can access all payments');
    }
    return await this.paymentRepository.find({
      relations: ['invoices', 'user', 'order', 'reservation', 'roomBooking'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, user?: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: id },
      relations: ['invoices', 'user', 'order', 'reservation', 'roomBooking'],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    // Check access permissions
    if (user) {
      await this.checkPaymentAccess(user, Number(id));
    }
    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto, user?: User): Promise<Payment> {
    // Only admin can update payments
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can update payments');
    }
    const payment = await this.findOne(id, user);
    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  async remove(id: number, user?: User): Promise<{ success: boolean; message: string }> {
    // Only admin can delete payments
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can delete payments');
    }
    const payment = await this.findOne(id, user);
    await this.paymentRepository.remove(payment);
    return { success: true, message: 'Payment deleted successfully' };
  }

  async getPaymentByReference(reference: string, user?: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { payment_reference: reference },
      relations: ['invoices', 'user', 'order', 'reservation', 'roomBooking'],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    // Check access permissions
    if (user) {
      await this.checkPaymentAccess(user, Number(payment.id));
    }
    return payment;
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId: number, user?: User): Promise<Payment[]> {
    // Users can only access their own payment history unless they're admin
    if (user && user.role.name !== UserRoleEnum.ADMIN && user.id !== userId) {
      throw new ForbiddenException('You can only access your own payment history');
    }
    return await this.paymentRepository.find({
      where: { user_id: userId }, // Now using explicit user_id column
      relations: ['invoices', 'user', 'order', 'reservation', 'roomBooking'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get restaurant payments (for restaurant owners)
   */
  async getRestaurantPayments(user: User): Promise<Payment[]> {
    if (user.role.name !== UserRoleEnum.RESTAURANT_OWNER) {
      throw new ForbiddenException('Only restaurant owners can access restaurant payments');
    }
    const restaurantId = await this.getUserRestaurantId(user);
    // Get payments for orders from this restaurant
    const orderPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.invoices', 'invoices')
      .leftJoinAndSelect('payment.user', 'user')
      .where('order.restaurant_id = :restaurantId', { restaurantId: restaurantId })
      .getMany();
    // Get payments for reservations from this restaurant
    const reservationPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.reservation', 'reservation')
      .leftJoinAndSelect('payment.invoices', 'invoices')
      .leftJoinAndSelect('payment.user', 'user')
      .where('reservation.restaurant_id = :restaurantId', { restaurantId: restaurantId })
      .getMany();
    // Combine and deduplicate payments
    const allPayments = [...orderPayments, ...reservationPayments];
    const uniquePayments = allPayments.filter(
      (payment, index, self) => index === self.findIndex((p) => p.id === payment.id),
    );
    return uniquePayments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  /**
   * Handle Paystack payment callback
   */
  async handlePaymentCallback(trxref: string, reference: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    // Handle payment callback logic
    try {
      // Use the reference parameter (they should be the same)
      const paymentReference = reference || trxref;
      // Find payment record
      const payment = await this.paymentRepository.findOne({
        where: { payment_reference: paymentReference },
        relations: ['user', 'order', 'reservation', 'roomBooking'],
      });
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }
      // If already processed, return current status
      if (payment.status === PaymentStatus.SUCCESS) {
        return {
          success: true,
          message: 'Payment already completed successfully',
          data: {
            status: payment.status,
            paymentId: payment.id,
            amount: payment.amount,
            paidAt: payment.paid_at,
          },
        };
      }
      if (payment.status === PaymentStatus.FAILED) {
        return {
          success: false,
          message: 'Payment failed',
          data: {
            status: payment.status,
            paymentId: payment.id,
            amount: payment.amount,
          },
        };
      }
      // Verify payment with Paystack
      const verifyResult = await this.verifyPayment({ reference: paymentReference });
      return verifyResult;
    } catch (error) {
      this.logger.error('Payment callback handling failed', error.stack);
      return {
        success: false,
        message: error.message || 'Payment callback processing failed',
      };
    }
  }

  /**
   * Initiate refund (if needed for restaurant management)
   */
  async initiateRefund(
    paymentId: number,
    reason: string,
    user?: User,
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    // Check permissions for refunds
    if (user) {
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
        const payment = await this.paymentRepository.findOne({
          where: { id: paymentId },
          relations: ['order', 'reservation', 'user'],
        });
 
        if (!payment) {
          throw new NotFoundException('Payment not found');
        }
 
        // Check if payment is for restaurant owner's establishment
        const hasAccess = await this.checkRestaurantPaymentAccess(user, payment);
        if (!hasAccess) {
          throw new ForbiddenException('You can only refund payments for your restaurant');
        }
      } else if (user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('Only administrators and restaurant owners can initiate refunds');
      }
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }
      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new BadRequestException('Only successful payments can be refunded');
      }
      // Call Paystack refund API
      const response = await axios.post<PaystackRefundResponse>(
        `${this.paystackBaseUrl}/refund`,
        {
          transaction: payment.payment_reference,
          amount: Math.round(payment.amount * 100), // Full refund in kobo
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.data && response.data.status) {
        payment.status = PaymentStatus.REFUNDED;
        payment.gateway_response = JSON.stringify(`Refunded: ${reason}`);
        payment.refunded_amount = payment.amount;
        await queryRunner.manager.save(payment);
        await queryRunner.commitTransaction();
        this.logger.log(`Refund initiated for payment: ${paymentId}`);
        return {
          success: true,
          message: 'Refund initiated successfully',
          data: response.data,
        };
      }
      throw new BadRequestException('Refund failed');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Refund failed', error.stack);
      throw new HttpException(
        error.response?.data?.message || 'Refund failed',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(user?: User): Promise<any> {
    // Only admin can access payment statistics
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can access payment statistics');
    }
    const totalPayments = await this.paymentRepository.count();
    const successfulPayments = await this.paymentRepository.count({
      where: { status: PaymentStatus.SUCCESS },
    });
    const pendingPayments = await this.paymentRepository.count({
      where: { status: PaymentStatus.PENDING },
    });
    const failedPayments = await this.paymentRepository.count({
      where: { status: PaymentStatus.FAILED },
    });
    const totalRevenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();
    const totalRevenue = totalRevenueResult?.total || 0;
    return {
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      totalRevenue: parseFloat(totalRevenue),
    };
  }

  /**
   * Search payments
   */
  async searchPayments(
    searchTerm: string,
    user?: User,
  ): Promise<Payment[]> {
    // Only admin can search all payments
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can search payments');
    }
    return await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.invoices', 'invoices')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.reservation', 'reservation')
      .where('payment.payment_reference LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('payment.email LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.email LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.first_name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.last_name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('payment.created_at', 'DESC')
      .getMany();
  }
}