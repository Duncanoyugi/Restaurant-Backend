import { IsOptional, IsUUID, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../entities/reservation.entity';

export class ReservationSearchDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}