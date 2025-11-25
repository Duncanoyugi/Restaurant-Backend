import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsUUID,
  Min,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  ingredients?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  preparationTime?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  calories?: number;

  @IsArray()
  @IsOptional()
  allergens?: string[];
}