import { IsNumber, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class KitchenOrderSearchDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  restaurantId: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  statusId?: number;

  @IsDateString()
  @IsOptional()
  date?: string;
}