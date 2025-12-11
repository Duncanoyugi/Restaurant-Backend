import { IsEnum, IsNumber, IsOptional, IsString, IsEmail, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsEmail()
  customerEmail: string;

  @IsString()
  customerName: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @IsOptional()
  orderId?: number;

  @IsNumber()
  @IsOptional()
  reservationId?: number;

  @IsNumber()
  @IsOptional()
  roomBookingId?: number;

  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @IsNumber()
  @IsOptional()
  userId?: number;
}