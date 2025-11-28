// backend\src\delivery\delivery.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Request,
  ForbiddenException
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
import { DeliveryService } from './delivery.service';
import { CreateVehicleInfoDto } from './dto/create-vehicle-info.dto';
import { UpdateVehicleInfoDto } from './dto/update-vehicle-info.dto';
import { CreateDeliveryTrackingDto } from './dto/create-delivery-tracking.dto';
import { DeliveryAssignmentDto } from './dto/delivery-assignment.dto';
import { DriverLocationDto } from './dto/driver-location.dto';
import { DeliverySearchDto } from './dto/delivery-search.dto';
import { AvailableDriversDto } from './dto/available-drivers.dto';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('delivery')
@ApiBearerAuth('JWT-auth')
@Controller('delivery')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // Vehicle Info endpoints
  @Post('vehicles')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Create vehicle information for driver (Driver only)' })
  @ApiResponse({ status: 201, description: 'Vehicle info created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  @ApiBody({ type: CreateVehicleInfoDto })
  createVehicleInfo(@Body() createVehicleInfoDto: CreateVehicleInfoDto, @Request() req) {
    // Ensure driver can only create their own vehicle info
    if (createVehicleInfoDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create vehicle info for yourself');
    }
    return this.deliveryService.createVehicleInfo(createVehicleInfoDto);
  }

  @Get('vehicles/user/:userId')
  @ApiOperation({ summary: 'Get vehicle information by user ID' })
  @ApiResponse({ status: 200, description: 'Vehicle info retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  findVehicleInfoByUserId(@Param('userId', ParseUUIDPipe) userId: string, @Request() req) {
    // Users can only view their own vehicle info unless they're admin
    if (req.user.role.name !== UserRoleEnum.ADMIN && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own vehicle information');
    }
    return this.deliveryService.findVehicleInfoByUserId(userId);
  }

  @Patch('vehicles/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Update vehicle information by user ID (Driver only)' })
  @ApiResponse({ status: 200, description: 'Vehicle info updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiBody({ type: UpdateVehicleInfoDto })
  updateVehicleInfo(
    @Param('userId', ParseUUIDPipe) userId: string, 
    @Body() updateVehicleInfoDto: UpdateVehicleInfoDto,
    @Request() req
  ) {
    // Ensure driver can only update their own vehicle info
    if (req.user.id !== userId) {
      throw new ForbiddenException('You can only update your own vehicle information');
    }
    return this.deliveryService.updateVehicleInfo(userId, updateVehicleInfoDto);
  }

  @Delete('vehicles/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Delete vehicle information by user ID (Driver only)' })
  @ApiResponse({ status: 200, description: 'Vehicle info deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  removeVehicleInfo(@Param('userId', ParseUUIDPipe) userId: string, @Request() req) {
    // Ensure driver can only delete their own vehicle info
    if (req.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own vehicle information');
    }
    return this.deliveryService.removeVehicleInfo(userId);
  }

  // Delivery Tracking endpoints
  @Post('tracking')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Create delivery tracking record (Admin/Restaurant only)' })
  @ApiResponse({ status: 201, description: 'Delivery tracking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiBody({ type: CreateDeliveryTrackingDto })
  createDeliveryTracking(@Body() createTrackingDto: CreateDeliveryTrackingDto, @Request() req) {
    return this.deliveryService.createDeliveryTracking(createTrackingDto, req.user);
  }

  @Post('tracking/location')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Update driver location (Driver only)' })
  @ApiResponse({ status: 200, description: 'Driver location updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  @ApiBody({ type: DriverLocationDto })
  updateDriverLocation(@Body() locationDto: DriverLocationDto, @Request() req) {
    // Ensure driver can only update their own location
    if (locationDto.driverId !== req.user.id) {
      throw new ForbiddenException('You can only update your own location');
    }
    return this.deliveryService.updateDriverLocation(locationDto);
  }

  @Get('tracking/order/:orderId')
  @ApiOperation({ summary: 'Get delivery tracking by order ID' })
  @ApiResponse({ status: 200, description: 'Delivery tracking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delivery tracking not found' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  getDeliveryTracking(@Param('orderId', ParseUUIDPipe) orderId: string, @Request() req) {
    return this.deliveryService.getDeliveryTracking(orderId, req.user);
  }

  @Get('tracking/order/:orderId/live')
  @ApiOperation({ summary: 'Get live delivery tracking by order ID' })
  @ApiResponse({ status: 200, description: 'Live tracking data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found or not in delivery' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  getLiveDeliveryTracking(@Param('orderId', ParseUUIDPipe) orderId: string, @Request() req) {
    return this.deliveryService.getLiveDeliveryTracking(orderId, req.user);
  }

  // Delivery Management endpoints
  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Assign delivery to driver (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Delivery assigned successfully' })
  @ApiResponse({ status: 400, description: 'Driver not available or invalid assignment' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiBody({ type: DeliveryAssignmentDto })
  assignDelivery(@Body() assignmentDto: DeliveryAssignmentDto, @Request() req) {
    return this.deliveryService.assignDelivery(assignmentDto, req.user);
  }

  @Get('drivers/available')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Find available drivers (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Available drivers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiQuery({ type: AvailableDriversDto })
  findAvailableDrivers(@Query() searchDto: AvailableDriversDto, @Request() req) {
    return this.deliveryService.findAvailableDrivers(searchDto, req.user);
  }

  @Post('estimate')
  @ApiOperation({ summary: 'Calculate delivery time estimate' })
  @ApiResponse({ status: 200, description: 'Delivery estimate calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  @ApiBody({ type: DeliveryEstimateDto })
  calculateDeliveryEstimate(@Body() estimateDto: DeliveryEstimateDto) {
    return this.deliveryService.calculateDeliveryEstimate(estimateDto);
  }

  // Analytics endpoints
  @Get('analytics/driver/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get driver delivery statistics (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Driver stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'driverId', description: 'Driver ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  getDriverDeliveryStats(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.deliveryService.getDriverDeliveryStats(driverId, startDate, endDate, req.user);
  }

  @Get('analytics/restaurant/:restaurantId')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get delivery performance for restaurant (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Delivery performance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'days', description: 'Number of days to analyze', required: false, type: Number })
  getDeliveryPerformance(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days') days: number = 7,
    @Request() req
  ) {
    return this.deliveryService.getDeliveryPerformance(restaurantId, days, req.user);
  }

  // Driver-specific endpoints
  @Get('my/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get current driver delivery statistics (Driver only)' })
  @ApiResponse({ status: 200, description: 'Driver stats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  getMyDeliveryStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.deliveryService.getDriverDeliveryStats(req.user.id, startDate, endDate, req.user);
  }

  @Get('my/active-deliveries')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get active deliveries for current driver (Driver only)' })
  @ApiResponse({ status: 200, description: 'Active deliveries retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  getMyActiveDeliveries(@Request() req) {
    return this.deliveryService.getActiveDeliveriesForDriver(req.user.id, req.user);
  }
}