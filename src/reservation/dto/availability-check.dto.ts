import { IsDateString, IsNotEmpty, IsNumber, Min, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityCheckDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  restaurantId: number;

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