import { IsOptional, IsInt, IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomBookingStatus } from '../entities/room-booking.entity';

export class BookingSearchDto {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  roomId?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  userId?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  restaurantId?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsEnum(RoomBookingStatus)
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