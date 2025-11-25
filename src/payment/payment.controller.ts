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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiHeader,
  ApiBearerAuth 
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Initialize a new payment
   * POST /payments/initialize
   */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize a new payment' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiBody({ type: CreatePaymentDto })
  async initializePayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.initializePayment(createPaymentDto);
  }

  /**
   * Verify payment status
   * POST /payments/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiResponse({ status: 200, description: 'Payment verification completed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiBody({ type: VerifyPaymentDto })
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(verifyPaymentDto);
  }

  /**
   * Handle Paystack webhook events
   * POST /payments/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Paystack webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'Paystack webhook signature',
    required: true,
  })
  @ApiBody({ type: PaystackWebhookDto })
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
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'List of all payments retrieved successfully' })
  async findAll() {
    return this.paymentService.findAll();
  }

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  /**
   * Get payment by reference
   * GET /payments/reference/:reference
   */
  @Get('reference/:reference')
  @ApiOperation({ summary: 'Get payment by reference' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  async findByReference(@Param('reference') reference: string) {
    return this.paymentService.getPaymentByReference(reference);
  }

  /**
   * Get user payment history
   * GET /payments/user/:userId
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'User payments retrieved successfully' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserPayments(@Param('userId') userId: string) {
    return this.paymentService.getUserPayments(userId);
  }

  /**
   * Update payment
   * PATCH /payments/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: UpdatePaymentDto })
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
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }

  /**
   * Initiate refund
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate refund for a payment' })
  @ApiResponse({ status: 200, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 400, description: 'Refund reason is required or payment cannot be refunded' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for refund',
          example: 'Customer requested cancellation'
        }
      },
      required: ['reason']
    }
  })
  async initiateRefund(
    @Param('id') id: string,
    @Body('reason') reason: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }
    return this.paymentService.initiateRefund(id, reason);
  }

  /**
   * Download invoice PDF
   * GET /payments/:id/invoice
   */
  @Get(':id/invoice')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 400, description: 'No invoice found for this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
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
  }
}