import { IsUUID, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class KitchenOrderSearchDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsOptional()
  statusId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}