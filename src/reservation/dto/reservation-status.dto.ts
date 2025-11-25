import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class ReservationStatusDto {
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;

  @IsUUID()
  @IsOptional()
  performedBy?: string;
}