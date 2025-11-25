import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MenuSearchDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  available?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}