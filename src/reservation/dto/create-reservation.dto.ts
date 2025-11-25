import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  IsDateString, 
  IsOptional,
  IsEnum,
  Min,
  Max
} from 'class-validator';
import { ReservationType, ReservationStatus } from '../entities/reservation.entity';

export class CreateReservationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsEnum(ReservationType)
  @IsNotEmpty()
  reservationType: ReservationType;

  @IsDateString()
  @IsNotEmpty()
  reservationDate: string;

  @IsString()
  @IsNotEmpty()
  reservationTime: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsNotEmpty()
  guestCount: number;

  @IsString()
  @IsOptional()
  specialRequest?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;
}