import { Expose, Type } from 'class-transformer';
import { OtpType, OtpStatus } from '../entities/otp.entity';

export class OtpResponseDto {
  @Expose()
  otp_id: number;

  @Expose()
  email: string;

  @Expose()
  otp_code: string;

  @Expose()
  otp_type: OtpType;

  @Expose()
  status: OtpStatus;

  @Expose()
  expires_at: Date;

  @Expose()
  verified_at?: Date;

  @Expose()
  attempts: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  constructor(partial: Partial<OtpResponseDto>) {
    Object.assign(this, partial);
  }
}

export class GenerateOtpResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => OtpResponseDto)
  otp?: OtpResponseDto;

  constructor(success: boolean, message: string, otp?: OtpResponseDto) {
    this.success = success;
    this.message = message;
    this.otp = otp;
  }
}

export class VerifyOtpResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
