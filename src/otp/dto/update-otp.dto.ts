import { PartialType } from '@nestjs/mapped-types';
import { CreateOtpDto } from './create-otp.dto';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { OtpStatus } from '../entities/otp.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOtpDto extends PartialType(CreateOtpDto) {
  @ApiProperty({ enum: OtpStatus, required: false })
  @IsOptional()
  @IsEnum(OtpStatus)
  status?: OtpStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  verified_at?: Date;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  attempts?: number;
}