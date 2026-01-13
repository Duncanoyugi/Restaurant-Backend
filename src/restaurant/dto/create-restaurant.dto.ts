import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsPhoneNumber
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

  @IsPhoneNumber('KE', {
    message: 'Phone number must be a valid format (e.g., 0712345678 or +254...)'
  })
  @IsNotEmpty()
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

  @IsNumber()
  @IsNotEmpty()
  ownerId: number;

  @IsNumber()
  @IsNotEmpty()
  cityId: number;

  @IsString()
  @IsOptional()
  cuisineType?: string;
}