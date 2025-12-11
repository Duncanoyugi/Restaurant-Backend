import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryOrderSearchDto {
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  restaurantId?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  driverId?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  statusId?: number;
}