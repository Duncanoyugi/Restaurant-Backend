import { IsOptional, IsUUID, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomBookingStatus } from '../entities/room-booking.entity';

export class BookingSearchDto {
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(RoomBookingStatus)
  @IsOptional()
  status?: RoomBookingStatus;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}