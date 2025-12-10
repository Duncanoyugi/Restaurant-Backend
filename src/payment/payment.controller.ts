import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  Res,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  /**
   * Initialize a new payment
   * POST /payments/initialize
   */
  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize a new payment' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer access required' })
  @ApiBody({ type: CreatePaymentDto })
  async initializePayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    // Customers can only create payments for themselves
    if (createPaymentDto.userId && createPaymentDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create payments for yourself');
    }

    // Auto-assign user ID if not provided
    const paymentData = {
      ...createPaymentDto,
      userId: createPaymentDto.userId || req.user.id
    };

    return this.paymentService.initializePayment(paymentData, req.user);
  }

  /**
   * Verify payment status
   * POST /payments/verify
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiResponse({ status: 200, description: 'Payment verification completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiBody({ type: VerifyPaymentDto })
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto, @Request() req) {
    return this.paymentService.verifyPayment(verifyPaymentDto, req.user);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all payments retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(@Request() req) {
    return this.paymentService.findAll(req.user);
  }

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.paymentService.findOne(id, req.user);
  }

  /**
   * Get payment by reference
   * GET /payments/reference/:reference
   */
  @Get('reference/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment by reference' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  async findByReference(@Param('reference') reference: string, @Request() req) {
    return this.paymentService.getPaymentByReference(reference, req.user);
  }

  /**
   * Get user payment history
   * GET /payments/user/:userId
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'User payments retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this user payments' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserPayments(@Param('userId') userId: string, @Request() req) {
    // Users can only access their own payment history unless they're admin
    if (req.user.role.name !== UserRoleEnum.ADMIN && req.user.id !== userId) {
      throw new ForbiddenException('You can only access your own payment history');
    }
    return this.paymentService.getUserPayments(userId, req.user);
  }

  /**
   * Update payment
   * PATCH /payments/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: UpdatePaymentDto })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req
  ) {
    return this.paymentService.update(id, updatePaymentDto, req.user);
  }

  /**
   * Delete payment
   * DELETE /payments/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.paymentService.remove(id, req.user);
  }

  /**
   * Initiate refund
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate refund for a payment (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 400, description: 'Refund reason is required or payment cannot be refunded' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
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
    @Body('reason') reason: string,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }
    return this.paymentService.initiateRefund(id, reason, req.user);
  }

  /**
   * Download invoice PDF
   * GET /payments/:id/invoice
   */
  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 400, description: 'No invoice found for this payment' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this payment invoice' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async getInvoice(@Param('id') id: string, @Res() res: Response, @Request() req) {
    const payment = await this.paymentService.findOne(id, req.user);

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

  /**
   * Get current user payment history
   * GET /payments/my-payments
   */
  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user payment history' })
  @ApiResponse({ status: 200, description: 'User payments retrieved successfully' })
  async getMyPayments(@Request() req) {
    return this.paymentService.getUserPayments(req.user.id, req.user);
  }

  /**
   * Handle Paystack payment callback
   * GET /payments/callback
   * This endpoint must be public as Paystack redirects users here without auth tokens
   */
  @Get('callback')
  @ApiOperation({ summary: 'Handle Paystack payment callback' })
  @ApiResponse({ status: 200, description: 'Payment callback processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid callback parameters' })
  async handlePaymentCallback(
    @Query('trxref') trxref: string,
    @Query('reference') reference: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.paymentService.handlePaymentCallback(trxref, reference);

      // Redirect to frontend success page
      if (result.success) {
        res.redirect(`${process.env.FRONTEND_URL}/payment/success?reference=${reference}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed?reference=${reference}`);
      }
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment/verification?reference=${reference}&error=${error.message}`);
    }
  }

  /**
   * Get restaurant payments (for restaurant owners)
   * GET /payments/restaurant/my-payments
   */
  @Get('restaurant/my-payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get current restaurant payments (Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Restaurant payments retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner access required' })
  async getMyRestaurantPayments(@Request() req) {
    return this.paymentService.getRestaurantPayments(req.user);
  }
}