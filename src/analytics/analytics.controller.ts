import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== ACTIVITY LOGGING ====================

  @Post('activity-logs')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Create activity log entry' })
  @ApiResponse({ status: 201, description: 'Activity logged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateActivityLogDto })
  async logActivity(@Body() createActivityLogDto: CreateActivityLogDto) {
    return this.analyticsService.logActivity(createActivityLogDto);
  }

  @Get('activity-logs')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get activity logs with filtering' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  @ApiQuery({ type: ActivityLogQueryDto })
  async getActivityLogs(@Query() query: ActivityLogQueryDto) {
    return this.analyticsService.getActivityLogs(query);
  }

  // ==================== BUSINESS ANALYTICS ====================

  @Get('dashboard')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get dashboard overview analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getDashboardOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardOverview(query);
  }

  @Get('revenue')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('orders')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get order analytics' })
  @ApiResponse({ status: 200, description: 'Order analytics retrieved successfully' })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getOrderAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrderAnalytics(query);
  }

  @Get('customers')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get customer analytics' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getCustomerAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCustomerAnalytics(query);
  }

  @Get('menu-performance')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get menu performance analytics' })
  @ApiResponse({ status: 200, description: 'Menu performance analytics retrieved successfully' })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getMenuPerformanceAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMenuPerformanceAnalytics(query);
  }

  // ==================== USER BEHAVIOR ANALYTICS ====================

  @Get('user-behavior/:userId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get user behavior analytics' })
  @ApiResponse({ status: 200, description: 'User behavior analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getUserBehaviorAnalytics(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getUserBehaviorAnalytics(userId, query);
  }

  @Get('my-behavior')
  @Roles(UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get my behavior analytics' })
  @ApiResponse({ status: 200, description: 'User behavior analytics retrieved successfully' })
  @ApiQuery({ type: AnalyticsQueryDto })
  async getMyBehaviorAnalytics(@Query() query: AnalyticsQueryDto, @Request() req) {
    console.log('🔍 Analytics Controller - req.user:', req.user);
    
    // Use sub as primary ID, fall back to id for backward compatibility
    const userId = req.user?.sub || req.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in JWT payload');
    }
    
    return this.analyticsService.getUserBehaviorAnalytics(userId, query);
  }
}