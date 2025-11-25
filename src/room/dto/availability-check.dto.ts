import { IsDateString, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class AvailabilityCheckDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  guests: number;
}