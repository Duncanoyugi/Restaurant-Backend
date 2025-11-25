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
  ClassSerializerInterceptor
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
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

@ApiTags('delivery')
@Controller('delivery')
@UseInterceptors(ClassSerializerInterceptor)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // Vehicle Info endpoints
  @Post('vehicles')
  @ApiOperation({ summary: 'Create vehicle information for driver' })
  @ApiResponse({ status: 201, description: 'Vehicle info created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateVehicleInfoDto })
  createVehicleInfo(@Body() createVehicleInfoDto: CreateVehicleInfoDto) {
    return this.deliveryService.createVehicleInfo(createVehicleInfoDto);
  }

  @Get('vehicles/user/:userId')
  @ApiOperation({ summary: 'Get vehicle information by user ID' })
  @ApiResponse({ status: 200, description: 'Vehicle info retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  findVehicleInfoByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.deliveryService.findVehicleInfoByUserId(userId);
  }

  @Patch('vehicles/user/:userId')
  @ApiOperation({ summary: 'Update vehicle information by user ID' })
  @ApiResponse({ status: 200, description: 'Vehicle info updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiBody({ type: UpdateVehicleInfoDto })
  updateVehicleInfo(
    @Param('userId', ParseUUIDPipe) userId: string, 
    @Body() updateVehicleInfoDto: UpdateVehicleInfoDto
  ) {
    return this.deliveryService.updateVehicleInfo(userId, updateVehicleInfoDto);
  }

  @Delete('vehicles/user/:userId')
  @ApiOperation({ summary: 'Delete vehicle information by user ID' })
  @ApiResponse({ status: 200, description: 'Vehicle info deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle info not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  removeVehicleInfo(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.deliveryService.removeVehicleInfo(userId);
  }

  // Delivery Tracking endpoints
  @Post('tracking')
  @ApiOperation({ summary: 'Create delivery tracking record' })
  @ApiResponse({ status: 201, description: 'Delivery tracking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateDeliveryTrackingDto })
  createDeliveryTracking(@Body() createTrackingDto: CreateDeliveryTrackingDto) {
    return this.deliveryService.createDeliveryTracking(createTrackingDto);
  }

  @Post('tracking/location')
  @ApiOperation({ summary: 'Update driver location' })
  @ApiResponse({ status: 200, description: 'Driver location updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  @ApiBody({ type: DriverLocationDto })
  updateDriverLocation(@Body() locationDto: DriverLocationDto) {
    return this.deliveryService.updateDriverLocation(locationDto);
  }

  @Get('tracking/order/:orderId')
  @ApiOperation({ summary: 'Get delivery tracking by order ID' })
  @ApiResponse({ status: 200, description: 'Delivery tracking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delivery tracking not found' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  getDeliveryTracking(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getDeliveryTracking(orderId);
  }

  @Get('tracking/order/:orderId/live')
  @ApiOperation({ summary: 'Get live delivery tracking by order ID' })
  @ApiResponse({ status: 200, description: 'Live tracking data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found or not in delivery' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  getLiveDeliveryTracking(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getLiveDeliveryTracking(orderId);
  }

  // Delivery Management endpoints
  @Post('assign')
  @ApiOperation({ summary: 'Assign delivery to driver' })
  @ApiResponse({ status: 200, description: 'Delivery assigned successfully' })
  @ApiResponse({ status: 400, description: 'Driver not available or invalid assignment' })
  @ApiBody({ type: DeliveryAssignmentDto })
  assignDelivery(@Body() assignmentDto: DeliveryAssignmentDto) {
    return this.deliveryService.assignDelivery(assignmentDto);
  }

  @Get('drivers/available')
  @ApiOperation({ summary: 'Find available drivers' })
  @ApiResponse({ status: 200, description: 'Available drivers retrieved successfully' })
  @ApiQuery({ type: AvailableDriversDto })
  findAvailableDrivers(@Query() searchDto: AvailableDriversDto) {
    return this.deliveryService.findAvailableDrivers(searchDto);
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
  @ApiOperation({ summary: 'Get driver delivery statistics' })
  @ApiResponse({ status: 200, description: 'Driver stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiParam({ name: 'driverId', description: 'Driver ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  getDriverDeliveryStats(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.deliveryService.getDriverDeliveryStats(driverId, startDate, endDate);
  }

  @Get('analytics/restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get delivery performance for restaurant' })
  @ApiResponse({ status: 200, description: 'Delivery performance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'days', description: 'Number of days to analyze', required: false, type: Number })
  getDeliveryPerformance(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days') days: number = 7
  ) {
    return this.deliveryService.getDeliveryPerformance(restaurantId, days);
  }
}