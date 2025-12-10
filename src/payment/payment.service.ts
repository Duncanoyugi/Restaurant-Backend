// backend\src\payment\payment.service.ts
import { Injectable, Logger, HttpException, HttpStatus, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as crypto from 'crypto';
import { Payment, PaymentStatus } from './entities/payment.entity';
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
  private async checkPaymentAccess(user: User, paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order', 'reservation', 'roomBooking']
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Admin has access to all payments
    if (user.role.name === UserRoleEnum.ADMIN) {
      return payment;
    }

    // Customers can only access their own payments
    if (user.role.name === UserRoleEnum.CUSTOMER && payment.userId !== user.id) {
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
    if (payment.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
        relations: ['restaurant', 'restaurant.owner']
      });
      if (order && order.restaurant.owner.id === user.id) {
        return true;
      }
    }

    // Check if payment is for a reservation from user's restaurant
    if (payment.reservationId) {
      const reservation = await this.reservationRepository.findOne({
        where: { id: payment.reservationId },
        relations: ['restaurant', 'restaurant.owner']
      });
      if (reservation && reservation.restaurant.owner.id === user.id) {
        return true;
      }
    }

    return false;
  }

  // Helper method to get user's restaurant ID
  private async getUserRestaurantId(user: User): Promise<string> {
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { owner: { id: user.id } }
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found for this user');
      }

      return restaurant.id;
    }

    throw new ForbiddenException('User does not have restaurant access');
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(createPaymentDto: CreatePaymentDto, user?: User): Promise<any> {
    // Check permissions for creating payments
    if (user) {
      // Customers can only create payments for themselves
      if (user.role.name === UserRoleEnum.CUSTOMER && String(createPaymentDto.userId) !== String(user.id)) {
        throw new ForbiddenException('You can only create payments for yourself');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate the related entity exists
      await this.validatePaymentEntity(createPaymentDto);

      // Generate unique reference
      const reference = `RMS_${uuidv4().replace(/-/g, '').substring(0, 20)}`;

      // Prepare payment data for Paystack
      const paymentData = {
        email: createPaymentDto.customerEmail,
        amount: Math.round(createPaymentDto.amount * 100), // Convert to kobo (smallest currency unit)
        reference,
        currency: createPaymentDto.currency || 'NGN',
        channels: this.getChannels(createPaymentDto.method),
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: createPaymentDto.customerName
            },
            ...(createPaymentDto.orderId ? [{
              display_name: "Order ID",
              variable_name: "order_id",
              value: createPaymentDto.orderId
            }] : []),
            ...(createPaymentDto.reservationId ? [{
              display_name: "Reservation ID",
              variable_name: "reservation_id",
              value: createPaymentDto.reservationId
            }] : []),
            ...(createPaymentDto.roomBookingId ? [{
              display_name: "Room Booking ID",
              variable_name: "room_booking_id",
              value: createPaymentDto.roomBookingId
            }] : [])
          ],
          payment_type: this.getPaymentType(createPaymentDto),
        },
        callback_url: createPaymentDto.callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/callback`
      };

      // Call Paystack API to initialize transaction
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.status) {
        throw new HttpException(
          response.data.message || 'Failed to initialize payment',
          HttpStatus.BAD_REQUEST,
        );
      }

      const paystackResponse = response.data;

      // Create payment record in database
      // Use relation objects (user, order, reservation, roomBooking) instead of non-existent *_Id fields
      const payment = queryRunner.manager.create(Payment, {
        user: createPaymentDto.userId ? { id: String(createPaymentDto.userId) } as any : undefined,
        order: createPaymentDto.orderId ? { id: createPaymentDto.orderId } as any : undefined,
        reservation: createPaymentDto.reservationId ? { id: createPaymentDto.reservationId } as any : undefined,
        roomBooking: createPaymentDto.roomBookingId ? { id: createPaymentDto.roomBookingId } as any : undefined,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'NGN',
        status: PaymentStatus.PENDING,
        method: createPaymentDto.method,
        reference,
        accessCode: paystackResponse.data.access_code,
        authorizationUrl: paystackResponse.data.authorization_url,
        customerEmail: createPaymentDto.customerEmail,
        customerName: createPaymentDto.customerName,
        metadata: JSON.stringify(paymentData.metadata),
      });

      await queryRunner.manager.save(payment);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Payment initialized: ${reference}`);

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

      if (error instanceof HttpException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data?.message || 'Failed to initialize payment',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      await queryRunner.release();
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
        where: { reference },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Check access permissions
      if (user) {
        await this.checkPaymentAccess(user, payment.id);
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
            paidAt: payment.paidAt,
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
        }
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
        payment.paidAt = new Date(verificationData.data.paid_at);
        payment.channel = verificationData.data.channel;
        payment.gatewayResponse = verificationData.data.gateway_response;
        payment.metadata = JSON.stringify(verificationData.data.metadata);

        await queryRunner.manager.save(payment);

        // Create invoice
        await this.createInvoiceWithTransaction(payment, queryRunner);

        // Update related entity status
        await this.updateRelatedEntityStatus(payment, queryRunner);

        this.logger.log(`Payment verified successfully: ${reference}`);
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.gatewayResponse = verificationData.data.gateway_response;
        await queryRunner.manager.save(payment);

        this.logger.warn(`Payment verification failed: ${reference}`);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        success: payment.status === PaymentStatus.SUCCESS,
        message: payment.status === PaymentStatus.SUCCESS
          ? 'Payment verified successfully'
          : 'Payment verification failed',
        data: {
          status: payment.status,
          paymentId: payment.id,
          amount: payment.amount,
          paidAt: payment.paidAt,
          reference: payment.reference,
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
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle successful charge webhook
   */
  private async handleChargeSuccess(data: any, queryRunner: any) {
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { reference: data.reference },
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
    payment.paidAt = new Date(data.paid_at);
    payment.channel = data.channel;
    payment.gatewayResponse = data.gateway_response;
    payment.metadata = JSON.stringify(data.metadata);

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
      where: { reference: data.reference },
    });

    if (payment && payment.status === PaymentStatus.PENDING) {
      payment.status = PaymentStatus.FAILED;
      payment.gatewayResponse = data.gateway_response || 'Payment failed';
      await queryRunner.manager.save(payment);

      this.logger.warn(`Payment failed: ${data.reference}`);
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string): void {
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(payload)
      .digest('hex');

    if (hash !== signature) {
      throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Create invoice with transaction
   */
  private async createInvoiceWithTransaction(payment: Payment, queryRunner: any) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const invoice = queryRunner.manager.create(Invoice, {
      paymentId: payment.id,
      invoiceNumber,
      issuedAt: new Date(),
      sentAt: new Date(),
      pdfUrl: '',
    });

    await queryRunner.manager.save(invoice);
    this.logger.log(`Invoice created: ${invoiceNumber}`);
    return invoice;
  }

  /**
   * Update related entity status after successful payment
   */
  private async updateRelatedEntityStatus(payment: Payment, queryRunner: any) {
    try {
      if (payment.orderId) {
        const order = await queryRunner.manager.findOne(Order, {
          where: { id: payment.orderId },
        });
        if (order) {
          order.status = 'paid'; // Adjust based on your Order entity status field
          await queryRunner.manager.save(order);
          this.logger.log(`Order ${payment.orderId} marked as paid`);
        }
      }

      if (payment.reservationId) {
        const reservation = await queryRunner.manager.findOne(Reservation, {
          where: { id: payment.reservationId },
        });
        if (reservation) {
          reservation.status = 'confirmed'; // Adjust based on your Reservation entity
          await queryRunner.manager.save(reservation);
          this.logger.log(`Reservation ${payment.reservationId} confirmed`);
        }
      }

      if (payment.roomBookingId) {
        const roomBooking = await queryRunner.manager.findOne(RoomBooking, {
          where: { id: payment.roomBookingId },
        });
        if (roomBooking) {
          roomBooking.status = 'confirmed'; // Adjust based on your RoomBooking entity
          await queryRunner.manager.save(roomBooking);
          this.logger.log(`Room booking ${payment.roomBookingId} confirmed`);
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
        where: { id: createPaymentDto.orderId },
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
        where: { id: createPaymentDto.roomBookingId },
      });
      if (!roomBooking) {
        throw new NotFoundException('Room booking not found');
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

    return channelMap[method] || ['card', 'bank', 'ussd', 'mobile_money', 'mpesa', 'airtel', 'orange', 'vodafone'];
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
      relations: ['invoices'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user?: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoices', 'order', 'reservation', 'roomBooking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check access permissions
    if (user) {
      await this.checkPaymentAccess(user, id);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, user?: User): Promise<Payment> {
    // Only admin can update payments
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can update payments');
    }

    const payment = await this.findOne(id, user);
    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  async remove(id: string, user?: User): Promise<{ success: boolean; message: string }> {
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
      where: { reference },
      relations: ['invoices'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check access permissions
    if (user) {
      await this.checkPaymentAccess(user, payment.id);
    }

    return payment;
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId: string, user?: User): Promise<Payment[]> {
    // Users can only access their own payment history unless they're admin
    if (user && user.role.name !== UserRoleEnum.ADMIN && user.id !== userId) {
      throw new ForbiddenException('You can only access your own payment history');
    }

    return await this.paymentRepository.find({
      where: { userId },
      relations: ['invoices'],
      order: { createdAt: 'DESC' },
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
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .getMany();

    // Get payments for reservations from this restaurant
    const reservationPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.reservation', 'reservation')
      .leftJoinAndSelect('payment.invoices', 'invoices')
      .where('reservation.restaurantId = :restaurantId', { restaurantId })
      .getMany();

    // Combine and deduplicate payments
    const allPayments = [...orderPayments, ...reservationPayments];
    const uniquePayments = allPayments.filter((payment, index, self) =>
      index === self.findIndex(p => p.id === payment.id)
    );

    return uniquePayments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
        where: { reference: paymentReference },
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
            paidAt: payment.paidAt,
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
  async initiateRefund(paymentId: string, reason: string, user?: User): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    // Check permissions for refunds
    if (user) {
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
        const payment = await this.paymentRepository.findOne({
          where: { id: paymentId },
          relations: ['order', 'reservation']
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
          transaction: payment.reference,
          amount: Math.round(payment.amount * 100), // Full refund in kobo
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status) {
        payment.status = PaymentStatus.REFUNDED;
        payment.gatewayResponse = `Refunded: ${reason}`;
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
}