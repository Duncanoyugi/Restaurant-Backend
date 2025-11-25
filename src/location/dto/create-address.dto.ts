import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsOptional, 
  IsNumber, 
  IsBoolean 
} from 'class-validator';

export class CreateAddressDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

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

  @IsUUID()
  @IsNotEmpty()
  cityId: string;

  @IsString()
  @IsOptional()
  deliveryInstructions?: string;
}