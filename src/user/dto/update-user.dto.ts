import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber('KE', {
    message: 'Please enter a valid phone number'
  })
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
