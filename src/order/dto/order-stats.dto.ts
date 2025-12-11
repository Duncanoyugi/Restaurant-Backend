import { IsNumber, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderStatsDto {
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  restaurantId?: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}