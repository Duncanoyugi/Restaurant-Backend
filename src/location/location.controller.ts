import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  DefaultValuePipe,
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
import { LocationService } from './location.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('location')
@ApiBearerAuth('JWT-auth')
@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Country endpoints - Admin only
  @Post('countries')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new country (Admin only)' })
  @ApiResponse({ status: 201, description: 'Country created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: CreateCountryDto })
  createCountry(@Body() createCountryDto: CreateCountryDto) {
    return this.locationService.createCountry(createCountryDto);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({ status: 200, description: 'Countries retrieved successfully' })
  findAllCountries() {
    return this.locationService.findAllCountries();
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiResponse({ status: 200, description: 'Country retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'id', description: 'Country ID', type: String })
  findOneCountry(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneCountry(id);
  }

  @Get('countries/iso/:isoCode')
  @ApiOperation({ summary: 'Get country by ISO code' })
  @ApiResponse({ status: 200, description: 'Country retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'isoCode', description: 'Country ISO code (e.g., KE, US)', type: String })
  findByCountryIsoCode(@Param('isoCode') isoCode: string) {
    return this.locationService.findByCountryIsoCode(isoCode);
  }

  @Patch('countries/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update country by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Country updated successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiParam({ name: 'id', description: 'Country ID', type: String })
  @ApiBody({ type: UpdateCountryDto })
  updateCountry(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCountryDto: UpdateCountryDto
  ) {
    return this.locationService.updateCountry(id, updateCountryDto);
  }

  @Delete('countries/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete country by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Country deleted successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiParam({ name: 'id', description: 'Country ID', type: String })
  removeCountry(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeCountry(id);
  }

  // State endpoints - Admin only
  @Post('states')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new state (Admin only)' })
  @ApiResponse({ status: 201, description: 'State created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: CreateStateDto })
  createState(@Body() createStateDto: CreateStateDto) {
    return this.locationService.createState(createStateDto);
  }

  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  @ApiResponse({ status: 200, description: 'States retrieved successfully' })
  findAllStates() {
    return this.locationService.findAllStates();
  }

  @Get('states/:id')
  @ApiOperation({ summary: 'Get state by ID' })
  @ApiResponse({ status: 200, description: 'State retrieved successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiParam({ name: 'id', description: 'State ID', type: String })
  findOneState(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneState(id);
  }

  @Get('states/country/:countryId')
  @ApiOperation({ summary: 'Get states by country ID' })
  @ApiResponse({ status: 200, description: 'States retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'countryId', description: 'Country ID', type: String })
  findStatesByCountry(@Param('countryId', ParseUUIDPipe) countryId: string) {
    return this.locationService.findStatesByCountry(countryId);
  }

  @Get('states/country/:countryId/name/:stateName')
  @ApiOperation({ summary: 'Get state by name and country ID' })
  @ApiResponse({ status: 200, description: 'State retrieved successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiParam({ name: 'countryId', description: 'Country ID', type: String })
  @ApiParam({ name: 'stateName', description: 'State name', type: String })
  findStateByNameAndCountry(
    @Param('countryId', ParseUUIDPipe) countryId: string,
    @Param('stateName') stateName: string
  ) {
    return this.locationService.findStateByNameAndCountry(stateName, countryId);
  }

  @Patch('states/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update state by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'State updated successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiParam({ name: 'id', description: 'State ID', type: String })
  @ApiBody({ type: UpdateStateDto })
  updateState(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateStateDto: UpdateStateDto
  ) {
    return this.locationService.updateState(id, updateStateDto);
  }

  @Delete('states/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete state by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'State deleted successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiParam({ name: 'id', description: 'State ID', type: String })
  removeState(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeState(id);
  }

  // City endpoints - Admin only for write operations
  @Post('cities')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new city (Admin only)' })
  @ApiResponse({ status: 201, description: 'City created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: CreateCityDto })
  createCity(@Body() createCityDto: CreateCityDto) {
    return this.locationService.createCity(createCityDto);
  }

  @Get('cities')
  @Public()
  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully' })
  findAllCities() {
    return this.locationService.findAllCities();
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiResponse({ status: 200, description: 'City retrieved successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiParam({ name: 'id', description: 'City ID', type: String })
  findOneCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneCity(id);
  }

  @Get('cities/state/:stateId')
  @ApiOperation({ summary: 'Get cities by state ID' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiParam({ name: 'stateId', description: 'State ID', type: String })
  findCitiesByState(@Param('stateId', ParseUUIDPipe) stateId: string) {
    return this.locationService.findCitiesByState(stateId);
  }

  @Get('cities/state/:stateId/name/:cityName')
  @ApiOperation({ summary: 'Get city by name and state ID' })
  @ApiResponse({ status: 200, description: 'City retrieved successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiParam({ name: 'stateId', description: 'State ID', type: String })
  @ApiParam({ name: 'cityName', description: 'City name', type: String })
  findCityByNameAndState(
    @Param('stateId', ParseUUIDPipe) stateId: string,
    @Param('cityName') cityName: string
  ) {
    return this.locationService.findCityByNameAndState(cityName, stateId);
  }

  @Patch('cities/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update city by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'City updated successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiParam({ name: 'id', description: 'City ID', type: String })
  @ApiBody({ type: UpdateCityDto })
  updateCity(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCityDto: UpdateCityDto
  ) {
    return this.locationService.updateCity(id, updateCityDto);
  }

  @Delete('cities/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete city by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'City deleted successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiParam({ name: 'id', description: 'City ID', type: String })
  removeCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeCity(id);
  }

  // Address endpoints - User-specific access
  @Post('addresses')
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateAddressDto })
  createAddress(@Body() createAddressDto: CreateAddressDto, @Request() req) {
    // Users can only create addresses for themselves
    if (createAddressDto.userId && createAddressDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create addresses for yourself');
    }
    
    // Auto-assign user ID if not provided
    const addressData = {
      ...createAddressDto,
      userId: createAddressDto.userId || req.user.id
    };
    
    return this.locationService.createAddress(addressData);
  }

  @Get('addresses')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all addresses (Admin only)' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAllAddresses() {
    return this.locationService.findAllAddresses();
  }

  @Get('addresses/:id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiParam({ name: 'id', description: 'Address ID', type: String })
  findOneAddress(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.locationService.findOneAddress(id, req.user);
  }

  @Get('addresses/user/:userId')
  @ApiOperation({ summary: 'Get addresses by user ID' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  findAddressesByUser(@Param('userId', ParseUUIDPipe) userId: string, @Request() req) {
    // Users can only view their own addresses unless they're admin
    if (req.user.role.name !== UserRoleEnum.ADMIN && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own addresses');
    }
    return this.locationService.findAddressesByUser(userId);
  }

  @Get('addresses/user/:userId/default')
  @ApiOperation({ summary: 'Get default address for user' })
  @ApiResponse({ status: 200, description: 'Default address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Default address not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  findDefaultAddress(@Param('userId', ParseUUIDPipe) userId: string, @Request() req) {
    // Users can only view their own default address unless they're admin
    if (req.user.role.name !== UserRoleEnum.ADMIN && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own default address');
    }
    return this.locationService.findDefaultAddress(userId);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update address by ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiParam({ name: 'id', description: 'Address ID', type: String })
  @ApiBody({ type: UpdateAddressDto })
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req
  ) {
    return this.locationService.updateAddress(id, updateAddressDto, req.user);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete address by ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiParam({ name: 'id', description: 'Address ID', type: String })
  removeAddress(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.locationService.removeAddress(id, req.user);
  }

  // Restaurant-focused location endpoints - Public or restaurant-specific access
  @Get('cities/with-restaurants')
  @ApiOperation({ summary: 'Get cities that have restaurants' })
  @ApiResponse({ status: 200, description: 'Cities with restaurants retrieved successfully' })
  findCitiesWithRestaurants() {
    return this.locationService.findCitiesWithRestaurants();
  }

  @Get('cities/popular')
  @ApiOperation({ summary: 'Get popular cities for restaurants' })
  @ApiResponse({ status: 200, description: 'Popular cities retrieved successfully' })
  @ApiQuery({ name: 'limit', description: 'Number of cities to return', required: false, type: Number })
  findPopularCities(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.locationService.findPopularCitiesForRestaurants(limit);
  }

  @Get('delivery/validate/:restaurantId/:addressId')
  @ApiOperation({ summary: 'Validate delivery address for restaurant' })
  @ApiResponse({ status: 200, description: 'Delivery address validated successfully' })
  @ApiResponse({ status: 400, description: 'Delivery not available to this address' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiParam({ name: 'addressId', description: 'Address ID', type: String })
  validateDeliveryAddress(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Request() req
  ) {
    return this.locationService.validateDeliveryAddress(restaurantId, addressId, req.user);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get location statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Location statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getLocationStatistics() {
    return this.locationService.getLocationStatistics();
  }

  // Bulk operations - Admin only
  @Post('cities/bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create multiple cities in bulk (Admin only)' })
  @ApiResponse({ status: 201, description: 'Cities created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: [CreateCityDto] })
  createBulkCities(@Body() createCityDtos: CreateCityDto[]) {
    return this.locationService.createBulkCities(createCityDtos);
  }

  // Kenya-specific endpoints - Public access
  @Get('kenya/cities/major')
  @ApiOperation({ summary: 'Get major Kenyan cities' })
  @ApiResponse({ status: 200, description: 'Major Kenyan cities retrieved successfully' })
  getKenyanMajorCities() {
    return this.locationService.getKenyanMajorCities();
  }

  @Get('kenya/cities/nearby/:cityName')
  @ApiOperation({ summary: 'Find cities nearby a Kenyan city' })
  @ApiResponse({ status: 200, description: 'Nearby cities retrieved successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiParam({ name: 'cityName', description: 'City name', type: String })
  @ApiQuery({ name: 'radius', description: 'Radius in kilometers', required: false, type: Number })
  findCitiesNearbyKenya(
    @Param('cityName') cityName: string,
    @Query('radius', new DefaultValuePipe(50), ParseIntPipe) radius: number
  ) {
    return this.locationService.findCitiesNearby(cityName, radius);
  }

  @Get('kenya/nairobi/areas')
  @ApiOperation({ summary: 'Get Nairobi areas and suburbs' })
  @ApiResponse({ status: 200, description: 'Nairobi areas retrieved successfully' })
  getNairobiAreas() {
    return this.locationService.getNairobiAreas();
  }

  // User-specific address endpoints
  @Get('my/addresses')
  @ApiOperation({ summary: 'Get current user addresses' })
  @ApiResponse({ status: 200, description: 'User addresses retrieved successfully' })
  getMyAddresses(@Request() req) {
    return this.locationService.findAddressesByUser(req.user.id);
  }

  @Get('my/default-address')
  @ApiOperation({ summary: 'Get current user default address' })
  @ApiResponse({ status: 200, description: 'Default address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Default address not found' })
  getMyDefaultAddress(@Request() req) {
    return this.locationService.findDefaultAddress(req.user.id);
  }

  @Post('my/addresses')
  @ApiOperation({ summary: 'Create address for current user' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateAddressDto })
  createMyAddress(@Body() createAddressDto: CreateAddressDto, @Request() req) {
    const addressData = {
      ...createAddressDto,
      userId: req.user.id // Always use current user's ID
    };
    return this.locationService.createAddress(addressData);
  }
}