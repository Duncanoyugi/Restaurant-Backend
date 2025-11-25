import { IsUUID, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class OrderStatsDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}