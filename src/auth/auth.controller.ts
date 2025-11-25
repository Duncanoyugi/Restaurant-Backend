import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  UseGuards,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Strong typing for JWT payload
interface JwtUserPayload {
  sub: string;
  email: string;
  role: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =========================================================================
  // REGISTER
  // =========================================================================
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // =========================================================================
  // VERIFY EMAIL WITH OTP
  // =========================================================================
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmail(verifyOtpDto);
  }

  // =========================================================================
  // RESEND VERIFICATION EMAIL
  // =========================================================================
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  // =========================================================================
  // LOGIN
  // =========================================================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // =========================================================================
  // FORGOT PASSWORD
  // =========================================================================
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // =========================================================================
  // RESET PASSWORD WITH OTP
  // =========================================================================
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPassword(
    @Body('email') email: string,
    @Body('otpCode') otpCode: string,
    @Body('newPassword') newPassword: string
  ) {
    return this.authService.resetPasswordWithOtp(email, otpCode, newPassword);
  }

  // =========================================================================
  // REFRESH TOKEN
  // =========================================================================
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // =========================================================================
  // LOGOUT
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  async logout(
    @Req()
    req: Request & { user: JwtUserPayload },
  ) {
    return this.authService.logout(req.user.sub);
  }
}