import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CategorySearchDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}