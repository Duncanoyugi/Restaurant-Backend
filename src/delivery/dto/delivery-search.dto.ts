import { IsOptional, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DeliverySearchDto {
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}