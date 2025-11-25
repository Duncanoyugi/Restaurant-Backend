import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  IsDateString, 
  IsOptional,
  Min,
  Max,
  IsEnum
} from 'class-validator';
import { RoomBookingStatus } from '../entities/room-booking.entity';

export class CreateRoomBookingDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsNotEmpty()
  numberOfGuests: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalPrice: number;

  @IsEnum(RoomBookingStatus)
  @IsOptional()
  status?: RoomBookingStatus;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}