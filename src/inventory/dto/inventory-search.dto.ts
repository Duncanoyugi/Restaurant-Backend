import { IsOptional, IsString, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class InventorySearchDto {
  @IsNumber()
  @IsNotEmpty()
  restaurantId: number;  // Changed from string/UUID to number

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  supplierId?: number;   // Changed from string/UUID to number

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