import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query,
  UseGuards,
  Request,
  Param,
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
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Log user activity' })
  @ApiResponse({ status: 201, description: 'Activity logged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateActivityLogDto })
  logActivity(@Body() createActivityLogDto: CreateActivityLogDto) {
    return this.analyticsService.logActivity(createActivityLogDto);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get activity logs (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ type: ActivityLogQueryDto })
  getActivityLogs(@Query() query: ActivityLogQueryDto) {
    return this.analyticsService.getActivityLogs(query);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get dashboard overview (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ type: AnalyticsQueryDto })
  getDashboardOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardOverview(query);
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get revenue analytics (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ type: AnalyticsQueryDto })
  getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get order analytics (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Order analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ type: AnalyticsQueryDto })
  getOrderAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrderAnalytics(query);
  }

  @Get('customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get customer analytics (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ type: AnalyticsQueryDto })
  getCustomerAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCustomerAnalytics(query);
  }

  @Get('menu-performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get menu performance analytics (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Menu performance analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ type: AnalyticsQueryDto })
  getMenuPerformanceAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMenuPerformanceAnalytics(query);
  }

  @Get('user-behavior/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get user behavior analytics by user ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User behavior analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ type: AnalyticsQueryDto })
  getUserBehaviorAnalytics(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getUserBehaviorAnalytics(userId, query);
  }

  @Get('user-behavior')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user behavior analytics' })
  @ApiResponse({ status: 200, description: 'User behavior analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ type: AnalyticsQueryDto })
  getMyBehaviorAnalytics(@Request() req, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUserBehaviorAnalytics(req.user.id, query);
  }
}