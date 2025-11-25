import { IsOptional, IsString, IsUUID, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class InventorySearchDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  lowStock?: boolean;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}