import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { UserRoleEnum } from '../../user/entities/user.types';

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

  @IsNotEmpty()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}