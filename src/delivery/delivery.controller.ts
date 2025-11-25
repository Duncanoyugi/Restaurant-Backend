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
import { DeliveryService } from './delivery.service';
import { CreateVehicleInfoDto } from './dto/create-vehicle-info.dto';
import { UpdateVehicleInfoDto } from './dto/update-vehicle-info.dto';
import { CreateDeliveryTrackingDto } from './dto/create-delivery-tracking.dto';
import { DeliveryAssignmentDto } from './dto/delivery-assignment.dto';
import { DriverLocationDto } from './dto/driver-location.dto';
import { DeliverySearchDto } from './dto/delivery-search.dto';
import { AvailableDriversDto } from './dto/available-drivers.dto';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';

@Controller('delivery')
@UseInterceptors(ClassSerializerInterceptor)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // Vehicle Info endpoints
  @Post('vehicles')
  createVehicleInfo(@Body() createVehicleInfoDto: CreateVehicleInfoDto) {
    return this.deliveryService.createVehicleInfo(createVehicleInfoDto);
  }

  @Get('vehicles/user/:userId')
  findVehicleInfoByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.deliveryService.findVehicleInfoByUserId(userId);
  }

  @Patch('vehicles/user/:userId')
  updateVehicleInfo(
    @Param('userId', ParseUUIDPipe) userId: string, 
    @Body() updateVehicleInfoDto: UpdateVehicleInfoDto
  ) {
    return this.deliveryService.updateVehicleInfo(userId, updateVehicleInfoDto);
  }

  @Delete('vehicles/user/:userId')
  removeVehicleInfo(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.deliveryService.removeVehicleInfo(userId);
  }

  // Delivery Tracking endpoints
  @Post('tracking')
  createDeliveryTracking(@Body() createTrackingDto: CreateDeliveryTrackingDto) {
    return this.deliveryService.createDeliveryTracking(createTrackingDto);
  }

  @Post('tracking/location')
  updateDriverLocation(@Body() locationDto: DriverLocationDto) {
    return this.deliveryService.updateDriverLocation(locationDto);
  }

  @Get('tracking/order/:orderId')
  getDeliveryTracking(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getDeliveryTracking(orderId);
  }

  @Get('tracking/order/:orderId/live')
  getLiveDeliveryTracking(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getLiveDeliveryTracking(orderId);
  }

  // Delivery Management endpoints
  @Post('assign')
  assignDelivery(@Body() assignmentDto: DeliveryAssignmentDto) {
    return this.deliveryService.assignDelivery(assignmentDto);
  }

  @Get('drivers/available')
  findAvailableDrivers(@Query() searchDto: AvailableDriversDto) {
    return this.deliveryService.findAvailableDrivers(searchDto);
  }

  @Post('estimate')
  calculateDeliveryEstimate(@Body() estimateDto: DeliveryEstimateDto) {
    return this.deliveryService.calculateDeliveryEstimate(estimateDto);
  }

  // Analytics endpoints
  @Get('analytics/driver/:driverId')
  getDriverDeliveryStats(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.deliveryService.getDriverDeliveryStats(driverId, startDate, endDate);
  }

  @Get('analytics/restaurant/:restaurantId')
  getDeliveryPerformance(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days') days: number = 7
  ) {
    return this.deliveryService.getDeliveryPerformance(restaurantId, days);
  }
}