import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsOptional, 
  IsNumber, 
  IsBoolean,
  IsUUID,
  Min,
  Max,
  Matches
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+254|0)[17]\d{8}$/, { 
    message: 'Phone number must be a valid Kenyan format' 
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  openingTime?: string;

  @IsString()
  @IsOptional()
  closingTime?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsUUID()
  @IsNotEmpty()
  ownerId: string;

  @IsUUID()
  @IsNotEmpty()
  cityId: string;
}