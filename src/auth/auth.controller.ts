import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  UseGuards,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth 
} from '@nestjs/swagger';
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
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully. OTP sent to email.' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid input data or user already exists' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error - email service unavailable' 
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // =========================================================================
  // VERIFY EMAIL WITH OTP
  // =========================================================================
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verified successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired OTP' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiBody({ type: VerifyOtpDto })
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmail(verifyOtpDto);
  }

  // =========================================================================
  // RESEND VERIFICATION EMAIL
  // =========================================================================
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification email sent successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email already verified' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com'
        }
      },
      required: ['email']
    }
  })
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  // =========================================================================
  // LOGIN
  // =========================================================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email not verified' 
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // =========================================================================
  // FORGOT PASSWORD
  // =========================================================================
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset OTP sent to email' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com'
        }
      },
      required: ['email']
    }
  })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // =========================================================================
  // RESET PASSWORD WITH OTP
  // =========================================================================
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired OTP' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com'
        },
        otpCode: {
          type: 'string',
          example: '123456'
        },
        newPassword: {
          type: 'string',
          format: 'password',
          example: 'NewPassword123!'
        }
      },
      required: ['email', 'otpCode', 'newPassword']
    }
  })
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
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens refreshed successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid refresh token' 
  })
  @ApiBody({ type: RefreshTokenDto })
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
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Logged out successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async logout(
    @Req()
    req: Request & { user: JwtUserPayload },
  ) {
    return this.authService.logout(req.user.sub);
  }
}