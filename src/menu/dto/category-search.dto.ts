import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class CategorySearchDto {
  @IsUUID()
  @IsOptional()
  restaurantId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}