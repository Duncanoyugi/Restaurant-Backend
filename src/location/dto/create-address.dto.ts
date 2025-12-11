import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsBoolean,
  IsInt 
} from 'class-validator';

export class CreateAddressDto {
  @IsInt()
  @IsOptional()
  userId?: number;  // Changed from string/UUID to number

  @IsString()
  @IsNotEmpty()
  streetAddress1: string;

  @IsString()
  @IsOptional()
  streetAddress2?: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsInt()
  @IsNotEmpty()
  cityId: number;  // Changed from string/UUID to number

  @IsString()
  @IsOptional()
  deliveryInstructions?: string;
}