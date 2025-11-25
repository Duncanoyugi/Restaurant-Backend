import { IsUUID, IsOptional, IsEnum } from 'class-validator';

export class DeliveryOrderSearchDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsUUID()
  @IsOptional()
  statusId?: string;
}