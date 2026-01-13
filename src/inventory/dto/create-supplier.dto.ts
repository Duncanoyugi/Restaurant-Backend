import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsPhoneNumber('KE', {
    message: 'Please enter a valid phone number'
  })
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}