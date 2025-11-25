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
  DefaultValuePipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
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

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Country endpoints
  @Post('countries')
  @ApiOperation({ summary: 'Create a new country' })
  @ApiResponse({ status: 201, description: 'Country created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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
  @ApiOperation({ summary: 'Update country by ID' })
  @ApiResponse({ status: 200, description: 'Country updated successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'id', description: 'Country ID', type: String })
  @ApiBody({ type: UpdateCountryDto })
  updateCountry(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCountryDto: UpdateCountryDto
  ) {
    return this.locationService.updateCountry(id, updateCountryDto);
  }

  @Delete('countries/:id')
  @ApiOperation({ summary: 'Delete country by ID' })
  @ApiResponse({ status: 200, description: 'Country deleted successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'id', description: 'Country ID', type: String })
  removeCountry(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeCountry(id);
  }

  // State endpoints
  @Post('states')
  @ApiOperation({ summary: 'Create a new state' })
  @ApiResponse({ status: 201, description: 'State created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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

  @Patch('states/:id')
  @ApiOperation({ summary: 'Update state by ID' })
  @ApiResponse({ status: 200, description: 'State updated successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiParam({ name: 'id', description: 'State ID', type: String })
  @ApiBody({ type: UpdateStateDto })
  updateState(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateStateDto: UpdateStateDto
  ) {
    return this.locationService.updateState(id, updateStateDto);
  }

  @Delete('states/:id')
  @ApiOperation({ summary: 'Delete state by ID' })
  @ApiResponse({ status: 200, description: 'State deleted successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiParam({ name: 'id', description: 'State ID', type: String })
  removeState(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeState(id);
  }

  // City endpoints
  @Post('cities')
  @ApiOperation({ summary: 'Create a new city' })
  @ApiResponse({ status: 201, description: 'City created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateCityDto })
  createCity(@Body() createCityDto: CreateCityDto) {
    return this.locationService.createCity(createCityDto);
  }

  @Get('cities')
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

  @Patch('cities/:id')
  @ApiOperation({ summary: 'Update city by ID' })
  @ApiResponse({ status: 200, description: 'City updated successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiParam({ name: 'id', description: 'City ID', type: String })
  @ApiBody({ type: UpdateCityDto })
  updateCity(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCityDto: UpdateCityDto
  ) {
    return this.locationService.updateCity(id, updateCityDto);
  }

  @Delete('cities/:id')
  @ApiOperation({ summary: 'Delete city by ID' })
  @ApiResponse({ status: 200, description: 'City deleted successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiParam({ name: 'id', description: 'City ID', type: String })
  removeCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeCity(id);
  }

  // Address endpoints
  @Post('addresses')
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateAddressDto })
  createAddress(@Body() createAddressDto: CreateAddressDto) {
    return this.locationService.createAddress(createAddressDto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get all addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  findAllAddresses() {
    return this.locationService.findAllAddresses();
  }

  @Get('addresses/:id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiParam({ name: 'id', description: 'Address ID', type: String })
  findOneAddress(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneAddress(id);
  }

  @Get('addresses/user/:userId')
  @ApiOperation({ summary: 'Get addresses by user ID' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  findAddressesByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.locationService.findAddressesByUser(userId);
  }

  @Get('addresses/user/:userId/default')
  @ApiOperation({ summary: 'Get default address for user' })
  @ApiResponse({ status: 200, description: 'Default address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Default address not found' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  findDefaultAddress(@Param('userId', ParseUUIDPipe) userId: string) {
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
    @Body() updateAddressDto: UpdateAddressDto
  ) {
    return this.locationService.updateAddress(id, updateAddressDto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete address by ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiParam({ name: 'id', description: 'Address ID', type: String })
  removeAddress(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeAddress(id);
  }

  // Restaurant-focused location endpoints
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
    @Param('addressId', ParseUUIDPipe) addressId: string
  ) {
    return this.locationService.validateDeliveryAddress(restaurantId, addressId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get location statistics' })
  @ApiResponse({ status: 200, description: 'Location statistics retrieved successfully' })
  getLocationStatistics() {
    return this.locationService.getLocationStatistics();
  }

  // Bulk operations
  @Post('cities/bulk')
  @ApiOperation({ summary: 'Create multiple cities in bulk' })
  @ApiResponse({ status: 201, description: 'Cities created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: [CreateCityDto] })
  createBulkCities(@Body() createCityDtos: CreateCityDto[]) {
    return this.locationService.createBulkCities(createCityDtos);
  }

  // Kenya-specific endpoints
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
}