import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserService } from '../user/user.service';
import { MailerService } from '../mailer/mailer.service';
import { OtpService } from '../otp/otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshToken } from './refresh-token.entity';
import { OtpType } from '../otp/entities/otp.entity';
import { UserStatus } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    private otpService: OtpService,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  // =========================================================================
  // REGISTER WITH EMAIL VERIFICATION
  // =========================================================================
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Pass role from DTO, default to 'Customer' if not provided
    const roleName = registerDto.role || 'Customer';
    const user = await this.usersService.create(registerDto, roleName);

    // Generate OTP for email verification
    const otpResult = await this.otpService.generateOtp(
      user.email, 
      OtpType.EMAIL_VERIFICATION, 
      10 // 10 minutes expiration
    );

    if (!otpResult.success || !otpResult.otp) {
      throw new InternalServerErrorException('Failed to generate OTP');
    }

    // Log OTP for development testing
    console.log(`🔐 OTP FOR ${user.email}: ${otpResult.otp.otp_code}`);

    // Send verification email - but don't throw error if it fails in development
    try {
      const emailSent = await this.mailerService.sendVerificationEmail(
        user.email,
        user.name,
        otpResult.otp.otp_code
      );

      if (!emailSent) {
        console.log('Email sending failed, but OTP is saved to database');
      }
    } catch (error) {
      console.log('Email service unavailable, but OTP is saved to database');
      console.log(`OTP Code: ${otpResult.otp.otp_code}`);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      message: 'Registration successful. Please check your email for verification code.',
      requiresVerification: true,
    };
  }

  // =========================================================================
  // VERIFY EMAIL WITH OTP
  // =========================================================================
  async verifyEmail(verifyOtpDto: VerifyOtpDto) {
    const { email, otpCode } = verifyOtpDto;

    const verifyResult = await this.otpService.verifyOtp(
      email, 
      otpCode, 
      OtpType.EMAIL_VERIFICATION
    );

    if (!verifyResult.success) {
      throw new BadRequestException(verifyResult.message);
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // FIX: Use the update method that exists in UserService
    // Since markEmailAsVerified doesn't exist, we'll update directly
    const updatedUser = await this.usersService.update(user.id, { 
      emailVerified: true,
      status: UserStatus.ACTIVE
    } as any); // Use type assertion since we know these fields exist

    // Send welcome email
    const storeUrl = this.configService.get<string>('STORE_URL', 'https://yourstore.com');
    await this.mailerService.sendWelcomeEmail(user.email, user.name, storeUrl);

    // Generate tokens after successful verification
    const tokens = await this.generateTokens(updatedUser);

    return {
      message: 'Email verified successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: true,
      },
      ...tokens,
    };
  }

  // =========================================================================
  // RESEND VERIFICATION EMAIL
  // =========================================================================
  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new OTP
    const otpResult = await this.otpService.resendOtp(
      user.email, 
      OtpType.EMAIL_VERIFICATION
    );

    if (!otpResult.success || !otpResult.otp) {
      throw new InternalServerErrorException('Failed to generate OTP');
    }

    // Log OTP for development
    console.log(`🔐 NEW OTP FOR ${user.email}: ${otpResult.otp.otp_code}`);

    // Try to send email, but don't fail if it doesn't work
    try {
      const emailSent = await this.mailerService.sendVerificationEmail(
        user.email,
        user.name,
        otpResult.otp.otp_code
      );

      if (!emailSent) {
        console.log('Email sending failed, but new OTP is generated');
      }
    } catch (error) {
      console.log('Email service unavailable, but new OTP is generated');
      console.log(`New OTP Code: ${otpResult.otp.otp_code}`);
    }

    return {
      message: 'Verification email sent successfully',
    };
  }

  // =========================================================================
  // PASSWORD RESET REQUEST
  // =========================================================================
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If the email exists, a password reset code has been sent',
      };
    }

    // Generate OTP for password reset
    const otpResult = await this.otpService.generateOtp(
      email, 
      OtpType.PASSWORD_RESET, 
      15 // 15 minutes for password reset
    );

    if (!otpResult.success || !otpResult.otp) {
      throw new InternalServerErrorException('Failed to generate password reset OTP');
    }

    // Send password reset email
    const emailSent = await this.mailerService.sendPasswordResetEmail(
      email,
      user.name,
      otpResult.otp.otp_code
    );

    if (!emailSent) {
      throw new InternalServerErrorException('Failed to send password reset email');
    }

    return {
      message: 'If the email exists, a password reset code has been sent',
    };
  }

  // =========================================================================
  // RESET PASSWORD WITH OTP
  // =========================================================================
  async resetPasswordWithOtp(
    email: string, 
    otpCode: string, 
    newPassword: string
  ) {
    const verifyResult = await this.otpService.verifyOtp(
      email, 
      otpCode, 
      OtpType.PASSWORD_RESET
    );

    if (!verifyResult.success) {
      throw new BadRequestException(verifyResult.message);
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // FIX: Hash password and update using the existing update method
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.update(user.id, { 
      password: hashedPassword 
    } as any); // Use type assertion

    return {
      message: 'Password reset successfully',
    };
  }

  // =========================================================================
  // LOGIN (Updated to require email verification)
  // =========================================================================
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  // =========================================================================
  // VALIDATE USER (LOGIN)
  // =========================================================================
  async validateUser(email: string, password: string) {
    // Must include password + role
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  // =========================================================================
  // JWT TOKEN GENERATION
  // =========================================================================
  async generateTokens(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role?.name,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // =========================================================================
  // SAVE REFRESH TOKEN
  // =========================================================================
  async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt,
      revoked: false,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  // =========================================================================
  // LOGOUT
  // =========================================================================
  async logout(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  // =========================================================================
  // REFRESH TOKENS
  // =========================================================================
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // FIX: Use findByEmail since findOne/findById might not exist
      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if refresh token is valid in database
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken, userId: user.id, revoked: false },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}