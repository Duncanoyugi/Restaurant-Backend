import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber('KE', {
    message: 'Please enter a valid phone number (e.g., 0712345678 or +254...)'
  })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

}