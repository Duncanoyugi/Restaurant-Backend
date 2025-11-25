import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import * as crypto from 'crypto';

import { CreateOtpDto } from './dto/create-otp.dto';
import { UpdateOtpDto } from './dto/update-otp.dto';
import { Otp, OtpType, OtpStatus } from './entities/otp.entity';
import { 
  GenerateOtpResponseDto, 
  VerifyOtpResponseDto, 
  OtpResponseDto 
} from './dto/otp-response.dto';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  /**
   * Generate a random OTP code
   */
  private generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Create a new OTP
   */
  async create(createOtpDto: CreateOtpDto): Promise<OtpResponseDto> {
    const otp = this.otpRepository.create(createOtpDto);
    const savedOtp = await this.otpRepository.save(otp);
    return new OtpResponseDto(savedOtp);
  }

  /**
   * Generate and save a new OTP for a specific purpose
   */
  async generateOtp(
    email: string, 
    otpType: OtpType, 
    expiresInMinutes: number = 10
  ): Promise<GenerateOtpResponseDto> {
    // Invalidate any existing active OTPs for this email and type
    await this.otpRepository.update(
      { 
        email, 
        otp_type: otpType, 
        status: OtpStatus.PENDING,
        expires_at: MoreThan(new Date())
      },
      { 
        status: OtpStatus.EXPIRED 
      }
    );

    const otpCode = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const otp = this.otpRepository.create({
      email,
      otp_code: otpCode,
      otp_type: otpType,
      expires_at: expiresAt,
      status: OtpStatus.PENDING,
    });

    const savedOtp = await this.otpRepository.save(otp);

    return new GenerateOtpResponseDto(
      true,
      'OTP generated successfully',
      new OtpResponseDto(savedOtp)
    );
  }

  /**
   * Verify an OTP
   */
  async verifyOtp(
    email: string, 
    otpCode: string, 
    otpType: OtpType
  ): Promise<VerifyOtpResponseDto> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        otp_code: otpCode,
        otp_type: otpType,
        status: OtpStatus.PENDING,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!otp) {
      // Increment attempts if OTP exists but is invalid
      const existingOtp = await this.otpRepository.findOne({
        where: {
          email,
          otp_code: otpCode,
          otp_type: otpType,
        },
      });

      if (existingOtp) {
        await this.incrementAttempts(existingOtp.otp_id);
        
        if (existingOtp.attempts + 1 >= 5) {
          await this.otpRepository.update(existingOtp.otp_id, {
            status: OtpStatus.EXPIRED
          });
          return new VerifyOtpResponseDto(false, 'Too many failed attempts. OTP expired.');
        }
      }

      return new VerifyOtpResponseDto(false, 'Invalid or expired OTP');
    }

    // Mark OTP as verified
    await this.otpRepository.update(otp.otp_id, {
      status: OtpStatus.VERIFIED,
      verified_at: new Date(),
    });

    return new VerifyOtpResponseDto(true, 'OTP verified successfully');
  }

  /**
   * Increment OTP attempts
   */
  private async incrementAttempts(otpId: number): Promise<void> {
    await this.otpRepository.increment({ otp_id: otpId }, 'attempts', 1);
  }

  /**
   * Validate OTP without marking it as verified
   */
  async validateOtp(
    email: string, 
    otpCode: string, 
    otpType: OtpType
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        otp_code: otpCode,
        otp_type: otpType,
        status: OtpStatus.PENDING,
        expires_at: MoreThan(new Date()),
        attempts: LessThan(5),
      },
    });

    return !!otp;
  }

  /**
   * Resend OTP - generates a new OTP and invalidates old ones
   */
  async resendOtp(email: string, otpType: OtpType): Promise<GenerateOtpResponseDto> {
    return this.generateOtp(email, otpType);
  }

  /**
   * Find all OTPs
   */
  async findAll(): Promise<OtpResponseDto[]> {
    const otps = await this.otpRepository.find();
    return otps.map(otp => new OtpResponseDto(otp));
  }

  /**
   * Find OTP by ID
   */
  async findOne(id: number): Promise<OtpResponseDto> {
    const otp = await this.otpRepository.findOne({ where: { otp_id: id } });
    
    if (!otp) {
      throw new NotFoundException(`OTP with ID ${id} not found`);
    }

    return new OtpResponseDto(otp);
  }

  /**
   * Find OTPs by email and type
   */
  async findByEmailAndType(email: string, otpType: OtpType): Promise<OtpResponseDto[]> {
    const otps = await this.otpRepository.find({
      where: { email, otp_type: otpType },
      order: { created_at: 'DESC' },
    });

    return otps.map(otp => new OtpResponseDto(otp));
  }

  /**
   * Update OTP
   */
  async update(id: number, updateOtpDto: UpdateOtpDto): Promise<OtpResponseDto> {
    const otp = await this.otpRepository.findOne({ where: { otp_id: id } });
    
    if (!otp) {
      throw new NotFoundException(`OTP with ID ${id} not found`);
    }

    await this.otpRepository.update(id, updateOtpDto);
    const updatedOtp = await this.otpRepository.findOne({ where: { otp_id: id } });
    
    // FIX: Check if updatedOtp exists before creating response
    if (!updatedOtp) {
      throw new NotFoundException(`OTP with ID ${id} not found after update`);
    }

    return new OtpResponseDto(updatedOtp);
  }

  /**
   * Remove OTP
   */
  async remove(id: number): Promise<void> {
    const otp = await this.otpRepository.findOne({ where: { otp_id: id } });
    
    if (!otp) {
      throw new NotFoundException(`OTP with ID ${id} not found`);
    }

    await this.otpRepository.delete(id);
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepository
      .createQueryBuilder()
      .delete()
      .from(Otp)
      .where('expires_at < :now', { now: new Date() })
      .orWhere('status = :expired', { expired: OtpStatus.EXPIRED })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get OTP stats for an email
   */
  async getOtpStats(email: string, otpType: OtpType): Promise<{
    total: number;
    pending: number;
    verified: number;
    expired: number;
  }> {
    const [total, pending, verified, expired] = await Promise.all([
      this.otpRepository.count({ where: { email, otp_type: otpType } }),
      this.otpRepository.count({ 
        where: { 
          email, 
          otp_type: otpType, 
          status: OtpStatus.PENDING,
          expires_at: MoreThan(new Date())
        } 
      }),
      this.otpRepository.count({ 
        where: { 
          email, 
          otp_type: otpType, 
          status: OtpStatus.VERIFIED 
        } 
      }),
      this.otpRepository.count({ 
        where: { 
          email, 
          otp_type: otpType, 
          status: OtpStatus.EXPIRED 
        } 
      }),
    ]);

    return { total, pending, verified, expired };
  }
}