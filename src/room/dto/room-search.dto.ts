import { IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class RoomSearchDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minCapacity?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  available?: boolean;

  @IsDateString()
  @IsOptional()
  checkInDate?: string;

  @IsDateString()
  @IsOptional()
  checkOutDate?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  guests?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}