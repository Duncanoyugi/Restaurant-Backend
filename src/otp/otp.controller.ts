import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { OtpService } from './otp.service';
import { CreateOtpDto } from './dto/create-otp.dto';
import { UpdateOtpDto } from './dto/update-otp.dto';
import { OtpType } from './entities/otp.entity';
import { 
  GenerateOtpResponseDto, 
  VerifyOtpResponseDto, 
  OtpResponseDto 
} from './dto/otp-response.dto';

@ApiTags('otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new OTP' })
  @ApiResponse({ status: 201, type: GenerateOtpResponseDto })
  async generateOtp(
    @Body('email') email: string,
    @Body('otpType') otpType: OtpType,
    @Body('expiresInMinutes') expiresInMinutes: number = 10
  ): Promise<GenerateOtpResponseDto> {
    return this.otpService.generateOtp(email, otpType, expiresInMinutes);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OTP' })
  @ApiResponse({ status: 200, type: VerifyOtpResponseDto })
  async verifyOtp(
    @Body('email') email: string,
    @Body('otpCode') otpCode: string,
    @Body('otpType') otpType: OtpType
  ): Promise<VerifyOtpResponseDto> {
    return this.otpService.verifyOtp(email, otpCode, otpType);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({ status: 200, type: GenerateOtpResponseDto })
  async resendOtp(
    @Body('email') email: string,
    @Body('otpType') otpType: OtpType
  ): Promise<GenerateOtpResponseDto> {
    return this.otpService.resendOtp(email, otpType);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new OTP (manual)' })
  @ApiResponse({ status: 201, type: OtpResponseDto })
  create(@Body() createOtpDto: CreateOtpDto): Promise<OtpResponseDto> {
    return this.otpService.create(createOtpDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all OTPs' })
  @ApiResponse({ status: 200, type: [OtpResponseDto] })
  findAll(): Promise<OtpResponseDto[]> {
    return this.otpService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get OTP statistics for email and type' })
  async getStats(
    @Query('email') email: string,
    @Query('otpType') otpType: OtpType
  ) {
    return this.otpService.getOtpStats(email, otpType);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get OTPs by email and type' })
  @ApiResponse({ status: 200, type: [OtpResponseDto] })
  findByEmailAndType(
    @Param('email') email: string,
    @Query('otpType') otpType: OtpType
  ): Promise<OtpResponseDto[]> {
    return this.otpService.findByEmailAndType(email, otpType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get OTP by ID' })
  @ApiResponse({ status: 200, type: OtpResponseDto })
  findOne(@Param('id') id: string): Promise<OtpResponseDto> {
    return this.otpService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update OTP' })
  @ApiResponse({ status: 200, type: OtpResponseDto })
  update(
    @Param('id') id: string, 
    @Body() updateOtpDto: UpdateOtpDto
  ): Promise<OtpResponseDto> {
    return this.otpService.update(+id, updateOtpDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete OTP' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.otpService.remove(+id);
  }

  @Post('cleanup/expired')
  @ApiOperation({ summary: 'Clean up expired OTPs' })
  async cleanupExpired(): Promise<{ message: string; deletedCount: number }> {
    const deletedCount = await this.otpService.cleanupExpiredOtps();
    return { 
      message: 'Expired OTPs cleaned up successfully', 
      deletedCount 
    };
  }
}