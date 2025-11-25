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
import { LocationService } from './location.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Country endpoints
  @Post('countries')
  createCountry(@Body() createCountryDto: CreateCountryDto) {
    return this.locationService.createCountry(createCountryDto);
  }

  @Get('countries')
  findAllCountries() {
    return this.locationService.findAllCountries();
  }

  @Get('countries/:id')
  findOneCountry(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneCountry(id);
  }

  @Get('countries/iso/:isoCode')
  findByCountryIsoCode(@Param('isoCode') isoCode: string) {
    return this.locationService.findByCountryIsoCode(isoCode);
  }

  @Patch('countries/:id')
  updateCountry(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCountryDto: UpdateCountryDto
  ) {
    return this.locationService.updateCountry(id, updateCountryDto);
  }

  @Delete('countries/:id')
  removeCountry(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeCountry(id);
  }

  // State endpoints
  @Post('states')
  createState(@Body() createStateDto: CreateStateDto) {
    return this.locationService.createState(createStateDto);
  }

  @Get('states')
  findAllStates() {
    return this.locationService.findAllStates();
  }

  @Get('states/:id')
  findOneState(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneState(id);
  }

  @Get('states/country/:countryId')
  findStatesByCountry(@Param('countryId', ParseUUIDPipe) countryId: string) {
    return this.locationService.findStatesByCountry(countryId);
  }

  @Patch('states/:id')
  updateState(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateStateDto: UpdateStateDto
  ) {
    return this.locationService.updateState(id, updateStateDto);
  }

  @Delete('states/:id')
  removeState(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeState(id);
  }

  // City endpoints
  @Post('cities')
  createCity(@Body() createCityDto: CreateCityDto) {
    return this.locationService.createCity(createCityDto);
  }

  @Get('cities')
  findAllCities() {
    return this.locationService.findAllCities();
  }

  @Get('cities/:id')
  findOneCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneCity(id);
  }

  @Get('cities/state/:stateId')
  findCitiesByState(@Param('stateId', ParseUUIDPipe) stateId: string) {
    return this.locationService.findCitiesByState(stateId);
  }

  @Patch('cities/:id')
  updateCity(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCityDto: UpdateCityDto
  ) {
    return this.locationService.updateCity(id, updateCityDto);
  }

  @Delete('cities/:id')
  removeCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeCity(id);
  }

  // Address endpoints
  @Post('addresses')
  createAddress(@Body() createAddressDto: CreateAddressDto) {
    return this.locationService.createAddress(createAddressDto);
  }

  @Get('addresses')
  findAllAddresses() {
    return this.locationService.findAllAddresses();
  }

  @Get('addresses/:id')
  findOneAddress(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findOneAddress(id);
  }

  @Get('addresses/user/:userId')
  findAddressesByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.locationService.findAddressesByUser(userId);
  }

  @Get('addresses/user/:userId/default')
  findDefaultAddress(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.locationService.findDefaultAddress(userId);
  }

  @Patch('addresses/:id')
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateAddressDto: UpdateAddressDto
  ) {
    return this.locationService.updateAddress(id, updateAddressDto);
  }

  @Delete('addresses/:id')
  removeAddress(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.removeAddress(id);
  }

  // Restaurant-focused location endpoints
  @Get('cities/with-restaurants')
  findCitiesWithRestaurants() {
    return this.locationService.findCitiesWithRestaurants();
  }

  @Get('cities/popular')
  findPopularCities(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.locationService.findPopularCitiesForRestaurants(limit);
  }

  @Get('delivery/validate/:restaurantId/:addressId')
  validateDeliveryAddress(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string
  ) {
    return this.locationService.validateDeliveryAddress(restaurantId, addressId);
  }

  @Get('statistics')
  getLocationStatistics() {
    return this.locationService.getLocationStatistics();
  }

  // Bulk operations
  @Post('cities/bulk')
  createBulkCities(@Body() createCityDtos: CreateCityDto[]) {
    return this.locationService.createBulkCities(createCityDtos);
  }

  // Kenya-specific endpoints
  @Get('kenya/cities/major')
  getKenyanMajorCities() {
    return this.locationService.getKenyanMajorCities();
  }

  @Get('kenya/cities/nearby/:cityName')
  findCitiesNearbyKenya(
    @Param('cityName') cityName: string,
    @Query('radius', new DefaultValuePipe(50), ParseIntPipe) radius: number
  ) {
    return this.locationService.findCitiesNearby(cityName, radius);
  }

  @Get('kenya/nairobi/areas')
  getNairobiAreas() {
    return this.locationService.getNairobiAreas();
  }
}