import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
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
    private dataSource: DataSource,
  ) {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
    
    if (!this.paystackSecretKey) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured');
      throw new Error('PAYSTACK_SECRET_KEY is required');
    }
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(createPaymentDto: CreatePaymentDto) {
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
        callback_url: createPaymentDto.callbackUrl || `${process.env.FRONTEND_URL}/payment/callback`
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
      const payment = queryRunner.manager.create(Payment, {
        userId: createPaymentDto.orderId, // This should ideally come from authenticated user context
        orderId: createPaymentDto.orderId,
        reservationId: createPaymentDto.reservationId,
        roomBookingId: createPaymentDto.roomBookingId,
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
      
      if (error instanceof HttpException) {
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
  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
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
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
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
      
      if (error instanceof HttpException) {
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
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
    }

    if (createPaymentDto.reservationId) {
      const reservation = await this.reservationRepository.findOne({
        where: { id: createPaymentDto.reservationId },
      });
      if (!reservation) {
        throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
      }
    }

    if (createPaymentDto.roomBookingId) {
      const roomBooking = await this.roomBookingRepository.findOne({
        where: { id: createPaymentDto.roomBookingId },
      });
      if (!roomBooking) {
        throw new HttpException('Room booking not found', HttpStatus.NOT_FOUND);
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
      mobile_money: ['mobile_money'],
      bank_transfer: ['bank_transfer'],
    };

    return channelMap[method] || ['card', 'bank', 'ussd', 'mobile_money'];
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

  async findAll() {
    return await this.paymentRepository.find({
      relations: ['invoices'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoices', 'order', 'reservation', 'roomBooking'],
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
    return { success: true, message: 'Payment deleted successfully' };
  }

  async getPaymentByReference(reference: string) {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: ['invoices'],
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    return payment;
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId: string) {
    return await this.paymentRepository.find({
      where: { userId },
      relations: ['invoices'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Initiate refund (if needed for restaurant management)
   */
  async initiateRefund(paymentId: string, reason: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: paymentId },
      });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new HttpException(
          'Only successful payments can be refunded',
          HttpStatus.BAD_REQUEST,
        );
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

      throw new HttpException('Refund failed', HttpStatus.BAD_REQUEST);
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