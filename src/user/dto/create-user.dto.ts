import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsPhoneNumber('KE', {
    message: 'Please enter a valid phone number'
  })
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
