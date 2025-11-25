import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { RoomBookingStatus } from '../entities/room-booking.entity';

export class BookingStatusDto {
  @IsEnum(RoomBookingStatus)
  @IsNotEmpty()
  status: RoomBookingStatus;

  @IsUUID()
  @IsOptional()
  performedBy?: string;
}