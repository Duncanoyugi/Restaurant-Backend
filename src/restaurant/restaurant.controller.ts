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
  ParseIntPipe,
  ParseFloatPipe,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantStaffDto } from './dto/create-restaurant-staff.dto';
import { UpdateRestaurantStaffDto } from './dto/update-restaurant-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { RestaurantSearchDto } from './dto/restaurant-search.dto';

@Controller('restaurants')
@UseInterceptors(ClassSerializerInterceptor)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // Restaurant endpoints
  @Post()
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.create(createRestaurantDto);
  }

  @Get()
  findAll(@Query() searchDto: RestaurantSearchDto) {
    return this.restaurantService.findAll(searchDto);
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) latitude: number,
    @Query('lng', ParseFloatPipe) longitude: number,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius: number
  ) {
    return this.restaurantService.findRestaurantsNearby(latitude, longitude, radius);
  }

  @Get('city/:cityId/popular')
  findPopularInCity(
    @Param('cityId', ParseUUIDPipe) cityId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.restaurantService.getPopularRestaurantsInCity(cityId, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.findOne(id);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.getRestaurantStatistics(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateRestaurantDto: UpdateRestaurantDto
  ) {
    return this.restaurantService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.remove(id);
  }

  // Staff endpoints
  @Post('staff')
  createStaff(@Body() createStaffDto: CreateRestaurantStaffDto) {
    return this.restaurantService.createStaff(createStaffDto);
  }

  @Get('staff/restaurant/:restaurantId')
  findAllStaff(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantService.findAllStaff(restaurantId);
  }

  @Get('staff/:id')
  findStaffById(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.findStaffById(id);
  }

  @Patch('staff/:id')
  updateStaff(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateStaffDto: UpdateRestaurantStaffDto
  ) {
    return this.restaurantService.updateStaff(id, updateStaffDto);
  }

  @Delete('staff/:id')
  removeStaff(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.removeStaff(id);
  }

  // Shift endpoints
  @Post('shifts')
  createShift(@Body() createShiftDto: CreateShiftDto) {
    return this.restaurantService.createShift(createShiftDto);
  }

  @Get('shifts/staff/:staffId')
  findShiftsByStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.restaurantService.findShiftsByStaff(staffId, startDate, endDate);
  }

  @Get('shifts/restaurant/:restaurantId')
  findShiftsByRestaurant(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('date') date?: string
  ) {
    return this.restaurantService.findShiftsByRestaurant(restaurantId, date);
  }

  @Patch('shifts/:id')
  updateShift(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateShiftDto: UpdateShiftDto
  ) {
    return this.restaurantService.updateShift(id, updateShiftDto);
  }

  @Delete('shifts/:id')
  removeShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.removeShift(id);
  }
}