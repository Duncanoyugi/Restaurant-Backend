import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsDateString,
  Min,
  IsInt
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsInt()
  @IsNotEmpty()
  restaurantId: number;  // Changed from string/UUID to number

  @IsInt()
  @IsNotEmpty()
  supplierId: number;    // Changed from string/UUID to number

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