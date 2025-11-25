import { Controller, Get } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse 
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API status' })
  @ApiResponse({ status: 200, description: 'API is running successfully' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString()
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version information' })
  @ApiResponse({ status: 200, description: 'Version information retrieved successfully' })
  getVersion(): { version: string; name: string; environment: string } {
    return {
      version: '1.0.0',
      name: 'Restaurant Management System API',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}