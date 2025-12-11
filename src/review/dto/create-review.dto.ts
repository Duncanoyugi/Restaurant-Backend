import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsUUID, 
  Min, 
  Max, 
  IsArray, 
  IsBoolean,
  IsEmail 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNumber()
  @IsOptional()
  restaurantId?: number;

  @IsNumber()
  @IsOptional()
  menuItemId?: number;

  @IsNumber()
  @IsOptional()
  orderId?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;
}