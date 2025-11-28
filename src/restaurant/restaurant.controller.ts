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
  ClassSerializerInterceptor,
  UseGuards
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
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantStaffDto } from './dto/create-restaurant-staff.dto';
import { UpdateRestaurantStaffDto } from './dto/update-restaurant-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { RestaurantSearchDto } from './dto/restaurant-search.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('restaurants')
@ApiBearerAuth()
@Controller('restaurants')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(RolesGuard)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // Restaurant endpoints
  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new restaurant' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateRestaurantDto })
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.create(createRestaurantDto);
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get all restaurants with filtering' })
  @ApiResponse({ status: 200, description: 'Restaurants retrieved successfully' })
  @ApiQuery({ type: RestaurantSearchDto })
  findAll(@Query() searchDto: RestaurantSearchDto) {
    return this.restaurantService.findAll(searchDto);
  }

  @Get('nearby')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Find restaurants nearby coordinates' })
  @ApiResponse({ status: 200, description: 'Nearby restaurants retrieved successfully' })
  @ApiQuery({ name: 'lat', description: 'Latitude', required: true, type: Number })
  @ApiQuery({ name: 'lng', description: 'Longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', description: 'Radius in kilometers', required: false, type: Number })
  findNearby(
    @Query('lat', ParseFloatPipe) latitude: number,
    @Query('lng', ParseFloatPipe) longitude: number,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius: number
  ) {
    return this.restaurantService.findRestaurantsNearby(latitude, longitude, radius);
  }

  @Get('city/:cityId/popular')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get popular restaurants in city' })
  @ApiResponse({ status: 200, description: 'Popular restaurants retrieved successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiParam({ name: 'cityId', description: 'City ID', type: String })
  @ApiQuery({ name: 'limit', description: 'Number of restaurants to return', required: false, type: Number })
  findPopularInCity(
    @Param('cityId', ParseUUIDPipe) cityId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.restaurantService.getPopularRestaurantsInCity(cityId, limit);
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.findOne(id);
  }

  @Get(':id/statistics')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get restaurant statistics' })
  @ApiResponse({ status: 200, description: 'Restaurant statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: String })
  getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.getRestaurantStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: String })
  @ApiBody({ type: UpdateRestaurantDto })
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateRestaurantDto: UpdateRestaurantDto
  ) {
    return this.restaurantService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: String })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.remove(id);
  }

  // Staff endpoints
  @Post('staff')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create restaurant staff member' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateRestaurantStaffDto })
  createStaff(@Body() createStaffDto: CreateRestaurantStaffDto) {
    return this.restaurantService.createStaff(createStaffDto);
  }

  @Get('staff/restaurant/:restaurantId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get all staff for restaurant' })
  @ApiResponse({ status: 200, description: 'Staff members retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  findAllStaff(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantService.findAllStaff(restaurantId);
  }

  @Get('staff/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiParam({ name: 'id', description: 'Staff ID', type: String })
  findStaffById(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.findStaffById(id);
  }

  @Patch('staff/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiParam({ name: 'id', description: 'Staff ID', type: String })
  @ApiBody({ type: UpdateRestaurantStaffDto })
  updateStaff(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateStaffDto: UpdateRestaurantStaffDto
  ) {
    return this.restaurantService.updateStaff(id, updateStaffDto);
  }

  @Delete('staff/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiParam({ name: 'id', description: 'Staff ID', type: String })
  removeStaff(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.removeStaff(id);
  }

  // Shift endpoints
  @Post('shifts')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Create a staff shift' })
  @ApiResponse({ status: 201, description: 'Shift created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateShiftDto })
  createShift(@Body() createShiftDto: CreateShiftDto) {
    return this.restaurantService.createShift(createShiftDto);
  }

  @Get('shifts/staff/:staffId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get shifts by staff member' })
  @ApiResponse({ status: 200, description: 'Shifts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiParam({ name: 'staffId', description: 'Staff ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: false })
  findShiftsByStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.restaurantService.findShiftsByStaff(staffId, startDate, endDate);
  }

  @Get('shifts/restaurant/:restaurantId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get shifts by restaurant' })
  @ApiResponse({ status: 200, description: 'Shifts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'date', description: 'Date to filter by (YYYY-MM-DD)', required: false })
  findShiftsByRestaurant(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('date') date?: string
  ) {
    return this.restaurantService.findShiftsByRestaurant(restaurantId, date);
  }

  @Patch('shifts/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Update shift by ID' })
  @ApiResponse({ status: 200, description: 'Shift updated successfully' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  @ApiParam({ name: 'id', description: 'Shift ID', type: String })
  @ApiBody({ type: UpdateShiftDto })
  updateShift(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateShiftDto: UpdateShiftDto
  ) {
    return this.restaurantService.updateShift(id, updateShiftDto);
  }

  @Delete('shifts/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete shift by ID' })
  @ApiResponse({ status: 200, description: 'Shift deleted successfully' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  @ApiParam({ name: 'id', description: 'Shift ID', type: String })
  removeShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.removeShift(id);
  }
}