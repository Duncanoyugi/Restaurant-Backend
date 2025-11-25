import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpCode,
  HttpStatus,
  Headers,
  Res,
  UseGuards,
  Request,
  BadRequestException
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Initialize a new payment
   * POST /payments/initialize
   */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializePayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.initializePayment(createPaymentDto);
  }

  /**
   * Verify payment status
   * POST /payments/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(verifyPaymentDto);
  }

  /**
   * Handle Paystack webhook events
   * POST /payments/webhook
   * 
   * IMPORTANT: This endpoint should NOT have authentication middleware
   * as it's called by Paystack servers
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() paystackWebhookDto: PaystackWebhookDto,
    @Headers('x-paystack-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }
    
    return this.paymentService.handleWebhook(paystackWebhookDto, signature);
  }

  /**
   * Get all payments
   * GET /payments
   */
  @Get()
  async findAll() {
    return this.paymentService.findAll();
  }

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  /**
   * Get payment by reference
   * GET /payments/reference/:reference
   */
  @Get('reference/:reference')
  async findByReference(@Param('reference') reference: string) {
    return this.paymentService.getPaymentByReference(reference);
  }

  /**
   * Get user payment history
   * GET /payments/user/:userId
   */
  @Get('user/:userId')
  async getUserPayments(@Param('userId') userId: string) {
    return this.paymentService.getUserPayments(userId);
  }

  /**
   * Update payment
   * PATCH /payments/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updatePaymentDto: UpdatePaymentDto
  ) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  /**
   * Delete payment
   * DELETE /payments/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }

  /**
   * Initiate refund
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async initiateRefund(
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }
    return this.paymentService.initiateRefund(id, reason);
  }

  /**
   * Download invoice PDF
   * GET /payments/:id/invoice
   * 
   * Note: You'll need to implement PDF generation
   * using a library like pdfkit or puppeteer
   */
  @Get(':id/invoice')
  async getInvoice(@Param('id') id: string, @Res() res: Response) {
    const payment = await this.paymentService.findOne(id);
    
    if (!payment.invoices || payment.invoices.length === 0) {
      throw new BadRequestException('No invoice found for this payment');
    }

    // TODO: Generate PDF invoice
    // For now, return invoice data as JSON
    res.json({
      success: true,
      data: payment.invoices[0],
      message: 'PDF generation not yet implemented'
    });

    // Example implementation with PDF:
    // const pdfBuffer = await this.generateInvoicePDF(payment);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.invoices[0].invoiceNumber}.pdf`);
    // res.send(pdfBuffer);
  }
}