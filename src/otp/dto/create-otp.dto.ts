import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { OtpType } from '../entities/otp.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp_code: string;

  @ApiProperty({ enum: OtpType, example: OtpType.EMAIL_VERIFICATION })
  @IsEnum(OtpType)
  otp_type: OtpType;
}