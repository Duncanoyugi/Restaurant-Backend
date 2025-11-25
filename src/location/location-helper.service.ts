import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

@Injectable()
export class LocationHelperService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  // Kenya-specific city data with approximate coordinates
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

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Format address for Kenya
  formatAddress(address: any): string {
    const parts = [
      address.streetAddress1,
      address.streetAddress2,
      address.city?.name,
      address.zipCode,
      'Kenya'
    ].filter(part => part && part.trim() !== '');

    return parts.join(', ');
  }

  // Get timezone for Kenya (East Africa Time)
  async getTimezoneForCity(cityId: string): Promise<string> {
    // All of Kenya uses East Africa Time (EAT)
    return 'Africa/Nairobi';
  }

  // Estimate delivery time for Kenya (considering traffic patterns)
  estimateDeliveryTime(distanceKm: number, isPeakHours: boolean = false): number {
    const baseTimeMinutes = 25; // Base preparation time in Kenya
    
    // Adjust speed based on traffic
    const averageSpeedKph = isPeakHours ? 20 : 30;
    const travelTimeMinutes = (distanceKm / averageSpeedKph) * 60;
    
    return Math.round(baseTimeMinutes + travelTimeMinutes);
  }

  // Calculate delivery cost for Kenya (in KES)
  calculateDeliveryCost(distanceKm: number, baseCost: number = 150): number {
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

  // Get coordinates for Kenyan cities by name
  getCityCoordinates(cityName: string): { latitude: number; longitude: number } | null {
    const normalizedName = cityName.toLowerCase().trim();
    return this.kenyanCities[normalizedName] || null;
  }

  // Validate if city is within delivery range (Kenya specific)
  async isCityWithinDeliveryRange(cityId: string, maxDistanceKm: number = 50): Promise<boolean> {
    const city = await this.cityRepository.findOne({ where: { id: cityId } });
    
    if (!city) return false;
    
    // For Kenya, assume most major cities are within delivery range
    const majorCities = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'];
    return majorCities.includes(city.name.toLowerCase());
  }

  // Get popular areas in Nairobi for restaurants
  getNairobiPopularAreas(): string[] {
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
      'Ngong Road'
    ];
  }

  // Format phone number for Kenya
  formatPhoneNumber(phone: string): string {
    // Convert to Kenyan format: +254 XXX XXX XXX
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '+254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      return '+' + cleaned;
    } else {
      return '+254' + cleaned;
    }
  }

  // Check if it's peak hours in Kenya
  isPeakHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    // Peak hours: 7-9 AM and 5-8 PM on weekdays
    if (isWeekend) return false;
    
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
  }

  // Get estimated preparation time for Kenyan restaurants
  getEstimatedPreparationTime(cuisineType?: string): number {
    const baseTime = 25; // Average preparation time in minutes
    
    const cuisineTimes: { [key: string]: number } = {
      'fast_food': 15,
      'local': 20,
      'continental': 30,
      'asian': 25,
      'bbq': 40,
      'seafood': 35
    };
    
    // Fix: Check if cuisineType exists and is a valid key
    if (cuisineType && cuisineType in cuisineTimes) {
      return cuisineTimes[cuisineType];
    }
    
    return baseTime;
  }
}