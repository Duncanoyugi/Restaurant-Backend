import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsUUID, 
  IsOptional, 
  IsDateString,
  Min,
  IsEnum
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  threshold: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}