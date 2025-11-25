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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'OTP generated successfully', type: GenerateOtpResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com'
        },
        otpType: {
          type: 'string',
          enum: Object.values(OtpType),
          example: OtpType.EMAIL_VERIFICATION
        },
        expiresInMinutes: {
          type: 'number',
          default: 10,
          example: 10
        }
      },
      required: ['email', 'otpType']
    }
  })
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
  @ApiResponse({ status: 200, description: 'OTP verified successfully', type: VerifyOtpResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'OTP not found' })
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
        otpType: {
          type: 'string',
          enum: Object.values(OtpType),
          example: OtpType.EMAIL_VERIFICATION
        }
      },
      required: ['email', 'otpCode', 'otpType']
    }
  })
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
  @ApiResponse({ status: 200, description: 'OTP resent successfully', type: GenerateOtpResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com'
        },
        otpType: {
          type: 'string',
          enum: Object.values(OtpType),
          example: OtpType.EMAIL_VERIFICATION
        }
      },
      required: ['email', 'otpType']
    }
  })
  async resendOtp(
    @Body('email') email: string,
    @Body('otpType') otpType: OtpType
  ): Promise<GenerateOtpResponseDto> {
    return this.otpService.resendOtp(email, otpType);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new OTP (manual)' })
  @ApiResponse({ status: 201, description: 'OTP created successfully', type: OtpResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateOtpDto })
  create(@Body() createOtpDto: CreateOtpDto): Promise<OtpResponseDto> {
    return this.otpService.create(createOtpDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all OTPs' })
  @ApiResponse({ status: 200, description: 'OTPs retrieved successfully', type: [OtpResponseDto] })
  findAll(): Promise<OtpResponseDto[]> {
    return this.otpService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get OTP statistics for email and type' })
  @ApiResponse({ status: 200, description: 'OTP statistics retrieved successfully' })
  @ApiQuery({ name: 'email', description: 'Email address', required: true })
  @ApiQuery({ name: 'otpType', description: 'OTP type', required: true, enum: OtpType })
  async getStats(
    @Query('email') email: string,
    @Query('otpType') otpType: OtpType
  ) {
    return this.otpService.getOtpStats(email, otpType);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get OTPs by email and type' })
  @ApiResponse({ status: 200, description: 'OTPs retrieved successfully', type: [OtpResponseDto] })
  @ApiParam({ name: 'email', description: 'Email address', type: String })
  @ApiQuery({ name: 'otpType', description: 'OTP type', required: false, enum: OtpType })
  findByEmailAndType(
    @Param('email') email: string,
    @Query('otpType') otpType: OtpType
  ): Promise<OtpResponseDto[]> {
    return this.otpService.findByEmailAndType(email, otpType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get OTP by ID' })
  @ApiResponse({ status: 200, description: 'OTP retrieved successfully', type: OtpResponseDto })
  @ApiResponse({ status: 404, description: 'OTP not found' })
  @ApiParam({ name: 'id', description: 'OTP ID', type: String })
  findOne(@Param('id') id: string): Promise<OtpResponseDto> {
    return this.otpService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update OTP' })
  @ApiResponse({ status: 200, description: 'OTP updated successfully', type: OtpResponseDto })
  @ApiResponse({ status: 404, description: 'OTP not found' })
  @ApiParam({ name: 'id', description: 'OTP ID', type: String })
  @ApiBody({ type: UpdateOtpDto })
  update(
    @Param('id') id: string, 
    @Body() updateOtpDto: UpdateOtpDto
  ): Promise<OtpResponseDto> {
    return this.otpService.update(+id, updateOtpDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete OTP' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'OTP deleted successfully' })
  @ApiResponse({ status: 404, description: 'OTP not found' })
  @ApiParam({ name: 'id', description: 'OTP ID', type: String })
  remove(@Param('id') id: string): Promise<void> {
    return this.otpService.remove(+id);
  }

  @Post('cleanup/expired')
  @ApiOperation({ summary: 'Clean up expired OTPs' })
  @ApiResponse({ status: 200, description: 'Expired OTPs cleaned up successfully' })
  async cleanupExpired(): Promise<{ message: string; deletedCount: number }> {
    const deletedCount = await this.otpService.cleanupExpiredOtps();
    return { 
      message: 'Expired OTPs cleaned up successfully', 
      deletedCount 
    };
  }
}