// backend\src\delivery\delivery.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateVehicleInfoDto } from './dto/create-vehicle-info.dto';
import { UpdateVehicleInfoDto } from './dto/update-vehicle-info.dto';
import { CreateDeliveryTrackingDto } from './dto/create-delivery-tracking.dto';
import { DeliveryAssignmentDto } from './dto/delivery-assignment.dto';
import { DriverLocationDto } from './dto/driver-location.dto';
import { AvailableDriversDto } from './dto/available-drivers.dto';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ==================== VEHICLE INFO ENDPOINTS ====================

  @Post('vehicle-info')
  @Roles(UserRoleEnum.DRIVER, UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create vehicle information for a driver' })
  @ApiResponse({ status: 201, description: 'Vehicle info created successfully' })
  @ApiResponse({ status: 409, description: 'Vehicle info already exists or license plate taken' })
  createVehicleInfo(@Body() createVehicleInfoDto: CreateVehicleInfoDto) {
    return this.deliveryService.createVehicleInfo(createVehicleInfoDto);
  }

  @Get('vehicle-info/user/:userId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get vehicle information by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Vehicle info retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  getVehicleInfoByUserId(@Param('userId') userId: string) {
    return this.deliveryService.findVehicleInfoByUserId(Number(userId));
  }

  @Put('vehicle-info/user/:userId')
  @Roles(UserRoleEnum.DRIVER, UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update vehicle information' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Vehicle info updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiResponse({ status: 409, description: 'License plate already exists' })
  updateVehicleInfo(
    @Param('userId') userId: string,
    @Body() updateVehicleInfoDto: UpdateVehicleInfoDto
  ) {
    return this.deliveryService.updateVehicleInfo(Number(userId), updateVehicleInfoDto);
  }

  @Delete('vehicle-info/user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRoleEnum.DRIVER, UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete vehicle information' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'Vehicle info deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  removeVehicleInfo(@Param('userId') userId: string) {
    return this.deliveryService.removeVehicleInfo(Number(userId));
  }

  // ==================== DELIVERY TRACKING ENDPOINTS ====================

  @Post('tracking')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Create delivery tracking record' })
  @ApiResponse({ status: 201, description: 'Tracking created successfully' })
  @ApiResponse({ status: 404, description: 'Order or driver not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  createDeliveryTracking(
    @Body() createTrackingDto: CreateDeliveryTrackingDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.createDeliveryTracking(createTrackingDto, user);
  }

  @Put('tracking/location')
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Update driver location (real-time tracking)' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'No active delivery found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  updateDriverLocation(
    @Body() locationDto: DriverLocationDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.updateDriverLocation(locationDto, user);
  }

  @Get('tracking/order/:orderId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get delivery tracking history for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Tracking history retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getDeliveryTracking(
    @Param('orderId') orderId: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.getDeliveryTracking(Number(orderId), user);
  }

  @Get('tracking/order/:orderId/live')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get live delivery tracking for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Live tracking data retrieved' })
  @ApiResponse({ status: 404, description: 'No active delivery found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getLiveDeliveryTracking(
    @Param('orderId') orderId: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.getLiveDeliveryTracking(Number(orderId), user);
  }

  // ==================== DELIVERY ASSIGNMENT ENDPOINTS ====================

  @Post('assign')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Assign a driver to a delivery' })
  @ApiResponse({ status: 201, description: 'Delivery assigned successfully' })
  @ApiResponse({ status: 400, description: 'Driver not available' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  assignDelivery(
    @Body() assignmentDto: DeliveryAssignmentDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.assignDelivery(assignmentDto, user);
  }

  @Get('drivers/available')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Find available drivers near a location' })
  @ApiResponse({ status: 200, description: 'Available drivers list' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAvailableDrivers(
    @Query() searchDto: AvailableDriversDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.findAvailableDrivers(searchDto, user);
  }

  @Post('estimate')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.CUSTOMER, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Calculate delivery estimate (distance and time)' })
  @ApiResponse({ status: 200, description: 'Delivery estimate calculated' })
  calculateDeliveryEstimate(@Body() estimateDto: DeliveryEstimateDto) {
    return this.deliveryService.calculateDeliveryEstimate(estimateDto);
  }

  // ==================== DRIVER-SPECIFIC ENDPOINTS ====================

  @Get('driver/:driverId/active-deliveries')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get active deliveries for a driver' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Active deliveries retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getActiveDeliveriesForDriver(
    @Param('driverId') driverId: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.getActiveDeliveriesForDriver(Number(driverId), user);
  }

  @Get('driver/:driverId/stats')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get delivery statistics for a driver' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  @ApiResponse({ status: 200, description: 'Driver stats retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getDriverDeliveryStats(
    @Param('driverId') driverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.getDriverDeliveryStats(
      Number(driverId),
      startDate,
      endDate,
      user
    );
  }

  // ==================== ANALYTICS ENDPOINTS ====================

  @Get('analytics/performance')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get delivery performance analytics' })
  @ApiQuery({ name: 'restaurantId', description: 'Restaurant ID', required: true })
  @ApiQuery({ name: 'days', description: 'Number of days to analyze', required: false, default: 7 })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getDeliveryPerformance(
    @Query('restaurantId') restaurantId: string,
    @Query('days') days: string = '7',
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.deliveryService.getDeliveryPerformance(
      Number(restaurantId),
      Number(days),
      user
    );
  }

  // ==================== HEALTH CHECK ====================

  @Get('health')
  @ApiOperation({ summary: 'Check delivery service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'delivery'
    };
  }
}