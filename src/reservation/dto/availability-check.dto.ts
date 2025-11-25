import { IsDateString, IsNotEmpty, IsNumber, IsUUID, Min, IsString, IsOptional } from 'class-validator';

export class AvailabilityCheckDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsDateString()
  @IsNotEmpty()
  reservationDate: string;

  @IsString()
  @IsNotEmpty()
  reservationTime: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  guestCount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number = 120; // Default 2 hours
}