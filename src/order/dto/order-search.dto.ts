import { IsOptional, IsUUID, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../entities/order.entity';

export class OrderSearchDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsUUID()
  @IsOptional()
  statusId?: string;

  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType;

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