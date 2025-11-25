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
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types'; // Fixed import

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('activity')
  @UseGuards(JwtAuthGuard)
  logActivity(@Body() createActivityLogDto: CreateActivityLogDto) {
    return this.analyticsService.logActivity(createActivityLogDto);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER) // Use UserRoleEnum
  getActivityLogs(@Query() query: ActivityLogQueryDto) {
    return this.analyticsService.getActivityLogs(query);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER) // Use UserRoleEnum
  getDashboardOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardOverview(query);
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER) // Use UserRoleEnum
  getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER) // Use UserRoleEnum
  getOrderAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrderAnalytics(query);
  }

  @Get('customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER) // Use UserRoleEnum
  getCustomerAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCustomerAnalytics(query);
  }

  @Get('menu-performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER) // Use UserRoleEnum
  getMenuPerformanceAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMenuPerformanceAnalytics(query);
  }

  @Get('user-behavior/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN) // Use UserRoleEnum
  getUserBehaviorAnalytics(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getUserBehaviorAnalytics(userId, query);
  }

  @Get('user-behavior')
  @UseGuards(JwtAuthGuard)
  getMyBehaviorAnalytics(@Request() req, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUserBehaviorAnalytics(req.user.id, query);
  }
}