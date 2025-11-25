import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class RestaurantSearchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  minRating?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}