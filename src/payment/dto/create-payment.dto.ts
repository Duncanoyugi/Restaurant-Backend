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

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  reservationId?: string;

  @IsString()
  @IsOptional()
  roomBookingId?: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}