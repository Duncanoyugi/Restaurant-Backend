import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';
import { City } from './entities/city.entity';
import { Address } from './entities/address.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class LocationService {
  // Kenya-specific city data with coordinates
  private readonly kenyanCities = {
    'nairobi': { lat: -1.286389, lng: 36.817223 },
    'mombasa': { lat: -4.0435, lng: 39.6682 },
    'kisumu': { lat: -0.1022, lng: 34.7617 },
    'nakuru': { lat: -0.3031, lng: 36.0800 },
    'eldoret': { lat: 0.5143, lng: 35.2698 },
    'thika': { lat: -1.0392, lng: 37.0714 },
    'malindi': { lat: -3.2175, lng: 40.1191 },
    'kitale': { lat: 1.0157, lng: 34.9893 },
    'garissa': { lat: -0.4565, lng: 39.6462 },
    'kakamega': { lat: 0.2827, lng: 34.7519 }
  };

  constructor(
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  // Country methods
  async createCountry(createCountryDto: CreateCountryDto): Promise<Country> {
    const country = this.countryRepository.create(createCountryDto);
    return await this.countryRepository.save(country);
  }

  async findAllCountries(): Promise<Country[]> {
    return await this.countryRepository.find({
      relations: ['states'],
      order: { name: 'ASC' },
    });
  }

  async findOneCountry(id: string): Promise<Country> {
    const country = await this.countryRepository.findOne({
      where: { id },
      relations: ['states', 'states.cities'],
    });
    
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    
    return country;
  }

  async findByCountryIsoCode(isoCode: string): Promise<Country> {
    const country = await this.countryRepository.findOne({
      where: [
        { iso2: isoCode },
        { iso3: isoCode }
      ],
      relations: ['states'],
    });
    
    if (!country) {
      throw new NotFoundException(`Country with ISO code ${isoCode} not found`);
    }
    
    return country;
  }

  async updateCountry(id: string, updateCountryDto: UpdateCountryDto): Promise<Country> {
    const country = await this.findOneCountry(id);
    Object.assign(country, updateCountryDto);
    return await this.countryRepository.save(country);
  }

  async removeCountry(id: string): Promise<void> {
    const country = await this.findOneCountry(id);
    await this.countryRepository.remove(country);
  }

  // State methods
  async createState(createStateDto: CreateStateDto): Promise<State> {
    const state = this.stateRepository.create(createStateDto);
    return await this.stateRepository.save(state);
  }

  async findAllStates(): Promise<State[]> {
    return await this.stateRepository.find({
      relations: ['country', 'cities'],
      order: { name: 'ASC' },
    });
  }

  async findOneState(id: string): Promise<State> {
    const state = await this.stateRepository.findOne({
      where: { id },
      relations: ['country', 'cities'],
    });
    
    if (!state) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }
    
    return state;
  }

  async findStatesByCountry(countryId: string): Promise<State[]> {
    return await this.stateRepository.find({
      where: { countryId },
      relations: ['cities'],
      order: { name: 'ASC' },
    });
  }

  async updateState(id: string, updateStateDto: UpdateStateDto): Promise<State> {
    const state = await this.findOneState(id);
    Object.assign(state, updateStateDto);
    return await this.stateRepository.save(state);
  }

  async removeState(id: string): Promise<void> {
    const state = await this.findOneState(id);
    await this.stateRepository.remove(state);
  }

  // City methods
  async createCity(createCityDto: CreateCityDto): Promise<City> {
    const city = this.cityRepository.create(createCityDto);
    return await this.cityRepository.save(city);
  }

  async findAllCities(): Promise<City[]> {
    return await this.cityRepository.find({
      relations: ['state', 'state.country'],
      order: { name: 'ASC' },
    });
  }

  async findOneCity(id: string): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { id },
      relations: ['state', 'state.country', 'addresses'],
    });
    
    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }
    
    return city;
  }

  async findCitiesByState(stateId: string): Promise<City[]> {
    return await this.cityRepository.find({
      where: { stateId },
      relations: ['state'],
      order: { name: 'ASC' },
    });
  }

  async updateCity(id: string, updateCityDto: UpdateCityDto): Promise<City> {
    const city = await this.findOneCity(id);
    Object.assign(city, updateCityDto);
    return await this.cityRepository.save(city);
  }

  async removeCity(id: string): Promise<void> {
    const city = await this.findOneCity(id);
    await this.cityRepository.remove(city);
  }

  // Address methods
  async createAddress(createAddressDto: CreateAddressDto): Promise<Address> {
    // If setting as default and has userId, unset other defaults for this user
    if (createAddressDto.isDefault && createAddressDto.userId) {
      await this.unsetUserDefaults(createAddressDto.userId);
    }

    const address = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(address);
  }

  async findAllAddresses(): Promise<Address[]> {
    return await this.addressRepository.find({
      relations: ['city', 'city.state', 'city.state.country', 'user'],
      withDeleted: false,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneAddress(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['city', 'city.state', 'city.state.country', 'user'],
    });
    
    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
    
    return address;
  }

  async findAddressesByUser(userId: string): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { userId },
      relations: ['city', 'city.state', 'city.state.country'],
      withDeleted: false,
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findDefaultAddress(userId: string): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: { userId, isDefault: true },
      relations: ['city', 'city.state', 'city.state.country'],
      withDeleted: false,
    });
  }

  async updateAddress(id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOneAddress(id);

    // If setting as default and has userId, unset other defaults for this user
    if (updateAddressDto.isDefault && !address.isDefault && address.userId) {
      await this.unsetUserDefaults(address.userId);
    }

    Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(address);
  }

  async removeAddress(id: string): Promise<void> {
    const address = await this.findOneAddress(id);
    await this.addressRepository.softRemove(address);
  }

  private async unsetUserDefaults(userId: string): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );
  }

  // Restaurant location methods
  async findCitiesWithRestaurants(): Promise<City[]> {
    return await this.cityRepository
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.restaurants', 'restaurant')
      .where('restaurant.id IS NOT NULL')
      .andWhere('restaurant.active = :active', { active: true })
      .groupBy('city.id')
      .having('COUNT(restaurant.id) > 0')
      .orderBy('city.name', 'ASC')
      .getMany();
  }

  async findPopularCitiesForRestaurants(limit: number = 10): Promise<City[]> {
    return await this.cityRepository
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.restaurants', 'restaurant')
      .where('restaurant.id IS NOT NULL')
      .andWhere('restaurant.active = :active', { active: true })
      .select(['city.id', 'city.name', 'city.stateId'])
      .addSelect('COUNT(restaurant.id)', 'restaurantCount')
      .groupBy('city.id')
      .orderBy('restaurantCount', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  // Kenya-focused geolocation methods
  async findCitiesNearby(cityName: string, radiusKm: number = 50): Promise<any[]> {
    const targetCity = this.getKenyanCityCoordinates(cityName);
    
    if (!targetCity) {
      throw new NotFoundException(`City ${cityName} not found in Kenya`);
    }

    const allCities = await this.cityRepository.find({
      relations: ['state', 'state.country', 'restaurants'],
    });

    // Filter cities within radius using our Kenyan cities data
    const nearbyCities = allCities.filter(city => {
      const cityCoords = this.getKenyanCityCoordinates(city.name);
      if (!cityCoords) return false;
      
      const distance = this.calculateDistance(
        targetCity.lat,
        targetCity.lng,
        cityCoords.lat,
        cityCoords.lng
      );
      
      return distance <= radiusKm;
    });

    return nearbyCities.map(city => ({
      id: city.id,
      name: city.name,
      state: city.state?.name,
      country: city.state?.country?.name,
      // Fix: Use 'active' instead of 'isActive'
      restaurantCount: city.restaurants?.filter(r => r.active).length || 0,
      distance: this.calculateDistance(
        targetCity.lat,
        targetCity.lng,
        this.getKenyanCityCoordinates(city.name)!.lat,
        this.getKenyanCityCoordinates(city.name)!.lng
      )
    }));
  }

  // Kenya-focused delivery validation
  async validateDeliveryAddress(restaurantId: string, addressId: string): Promise<{ 
    valid: boolean; 
    distance?: number; 
    estimatedTime?: number;
    cost?: number;
  }> {
    const address = await this.findOneAddress(addressId);
    
    // For Kenya, simple validation - check if restaurant is in the same city
    const restaurantCity = await this.cityRepository
      .createQueryBuilder('city')
      .innerJoin('city.restaurants', 'restaurant')
      .where('restaurant.id = :restaurantId', { restaurantId })
      .getOne();

    if (!restaurantCity) {
      throw new NotFoundException('Restaurant not found');
    }

    const valid = restaurantCity.id === address.cityId;
    let distance: number | undefined;
    let estimatedTime: number | undefined;
    let cost: number | undefined;

    if (valid) {
      // For same city delivery in Kenya
      distance = 8; // Average distance in km within same city
      estimatedTime = this.estimateDeliveryTimeKenya(distance, this.isPeakHours());
      cost = this.calculateDeliveryCostKenya(distance);
    }

    return {
      valid,
      distance,
      estimatedTime,
      cost
    };
  }

  // Bulk location operations for restaurant chains
  async createBulkCities(citiesData: CreateCityDto[]): Promise<City[]> {
    const cities = citiesData.map(data => this.cityRepository.create(data));
    return await this.cityRepository.save(cities);
  }

  async getLocationStatistics(): Promise<any> {
    const [totalCountries, totalStates, totalCities, totalAddresses] = await Promise.all([
      this.countryRepository.count(),
      this.stateRepository.count(),
      this.cityRepository.count(),
      this.addressRepository.count()
    ]);

    const citiesWithRestaurants = await this.cityRepository
      .createQueryBuilder('city')
      .innerJoin('city.restaurants', 'restaurant')
      .where('restaurant.active = :active', { active: true })
      .getCount();

    return {
      totalCountries,
      totalStates,
      totalCities,
      totalAddresses,
      citiesWithRestaurants,
      coveragePercentage: totalCities > 0 ? (citiesWithRestaurants / totalCities * 100).toFixed(2) : 0
    };
  }

  // Kenya-specific methods
  async getKenyanMajorCities(): Promise<City[]> {
    const majorCityNames = [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 
      'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'
    ];
    
    return await this.cityRepository
      .createQueryBuilder('city')
      .where('city.name IN (:...names)', { names: majorCityNames })
      .leftJoinAndSelect('city.restaurants', 'restaurant')
      .getMany();
  }

  async getNairobiAreas(): Promise<string[]> {
    // Popular areas in Nairobi for restaurants
    return [
      'Westlands',
      'Kilimani',
      'Karen',
      'Lavington',
      'Upper Hill',
      'CBD',
      'Parklands',
      'South B',
      'South C',
      'Ngong Road',
      'Adams Arcade',
      'Yaya Centre',
      'Hurlingham',
      'Muthaiga'
    ];
  }

  // Helper methods
  private getKenyanCityCoordinates(cityName: string): { lat: number; lng: number } | null {
    const normalizedName = cityName.toLowerCase().trim();
    return this.kenyanCities[normalizedName] || null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Number((R * c).toFixed(2));
  }

  private estimateDeliveryTimeKenya(distanceKm: number, isPeakHours: boolean = false): number {
    const baseTimeMinutes = 25; // Base preparation time in Kenya
    
    // Adjust speed based on traffic
    const averageSpeedKph = isPeakHours ? 20 : 30;
    const travelTimeMinutes = (distanceKm / averageSpeedKph) * 60;
    
    return Math.round(baseTimeMinutes + travelTimeMinutes);
  }

  private calculateDeliveryCostKenya(distanceKm: number, baseCost: number = 150): number {
    // Delivery cost structure for Kenya
    if (distanceKm <= 3) {
      return baseCost; // Within same area
    } else if (distanceKm <= 8) {
      return baseCost + 50; // Nearby areas
    } else if (distanceKm <= 15) {
      return baseCost + 100; // Further areas
    } else {
      return baseCost + 200; // Distant areas
    }
  }

  private isPeakHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    // Peak hours: 7-9 AM and 5-8 PM on weekdays
    if (isWeekend) return false;
    
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
  }
}