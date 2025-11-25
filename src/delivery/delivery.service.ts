import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, MoreThan, LessThan } from 'typeorm';
import { DeliveryTracking } from './entities/delivery-tracking.entity';
import { VehicleInfo } from './entities/vehicle-info.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { CreateVehicleInfoDto } from './dto/create-vehicle-info.dto';
import { UpdateVehicleInfoDto } from './dto/update-vehicle-info.dto';
import { CreateDeliveryTrackingDto } from './dto/create-delivery-tracking.dto';
import { DeliveryAssignmentDto } from './dto/delivery-assignment.dto';
import { DriverLocationDto } from './dto/driver-location.dto';
import { DeliverySearchDto } from './dto/delivery-search.dto';
import { AvailableDriversDto } from './dto/available-drivers.dto';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeliveryService {
  private readonly googleMapsApiKey: string;

  constructor(
    @InjectRepository(DeliveryTracking)
    private deliveryTrackingRepository: Repository<DeliveryTracking>,
    @InjectRepository(VehicleInfo)
    private vehicleInfoRepository: Repository<VehicleInfo>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.googleMapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
  }

  // Vehicle Info CRUD operations
  async createVehicleInfo(createVehicleInfoDto: CreateVehicleInfoDto): Promise<VehicleInfo> {
    // Check if user already has vehicle info
    const existingVehicleInfo = await this.vehicleInfoRepository.findOne({
      where: { userId: createVehicleInfoDto.userId }
    });

    if (existingVehicleInfo) {
      throw new ConflictException('Vehicle info already exists for this user');
    }

    // Check if license plate is unique
    const existingLicensePlate = await this.vehicleInfoRepository.findOne({
      where: { licensePlate: createVehicleInfoDto.licensePlate }
    });

    if (existingLicensePlate) {
      throw new ConflictException('License plate already exists');
    }

    const vehicleInfo = this.vehicleInfoRepository.create(createVehicleInfoDto);
    return await this.vehicleInfoRepository.save(vehicleInfo);
  }

  async findVehicleInfoByUserId(userId: string): Promise<VehicleInfo> {
    const vehicleInfo = await this.vehicleInfoRepository.findOne({
      where: { userId },
      relations: ['user']
    });

    if (!vehicleInfo) {
      throw new NotFoundException('Vehicle info not found for this user');
    }

    return vehicleInfo;
  }

  async updateVehicleInfo(userId: string, updateVehicleInfoDto: UpdateVehicleInfoDto): Promise<VehicleInfo> {
    const vehicleInfo = await this.findVehicleInfoByUserId(userId);

    // Check if license plate is being updated and if it's unique
    if (updateVehicleInfoDto.licensePlate && updateVehicleInfoDto.licensePlate !== vehicleInfo.licensePlate) {
      const existingLicensePlate = await this.vehicleInfoRepository.findOne({
        where: { licensePlate: updateVehicleInfoDto.licensePlate }
      });

      if (existingLicensePlate) {
        throw new ConflictException('License plate already exists');
      }
    }

    Object.assign(vehicleInfo, updateVehicleInfoDto);
    return await this.vehicleInfoRepository.save(vehicleInfo);
  }

  async removeVehicleInfo(userId: string): Promise<void> {
    const vehicleInfo = await this.findVehicleInfoByUserId(userId);
    await this.vehicleInfoRepository.remove(vehicleInfo);
  }

  // Delivery Tracking operations
  async createDeliveryTracking(createTrackingDto: CreateDeliveryTrackingDto): Promise<DeliveryTracking> {
    // Verify order exists and is a delivery order
    const order = await this.orderRepository.findOne({
      where: { 
        id: createTrackingDto.orderId
      } as FindOptionsWhere<Order>
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify driver exists and is a driver
    const driver = await this.userRepository.findOne({
      where: { 
        id: createTrackingDto.driverId
      },
      relations: ['role']
    });

    if (!driver || driver.role?.name !== 'Driver') {
      throw new NotFoundException('Driver not found');
    }

    const tracking = this.deliveryTrackingRepository.create(createTrackingDto);
    return await this.deliveryTrackingRepository.save(tracking);
  }

  async updateDriverLocation(locationDto: DriverLocationDto): Promise<DeliveryTracking> {
    // Find active delivery for this driver
    const activeDelivery = await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.driverId = :driverId', { driverId: locationDto.driverId })
      .andWhere('tracking.createdAt > :recent', { recent: new Date(Date.now() - 30 * 60 * 1000) }) // Last 30 minutes
      .orderBy('tracking.createdAt', 'DESC')
      .getOne();

    if (!activeDelivery) {
      throw new NotFoundException('No active delivery found for this driver');
    }

    // Calculate distance to destination and ETA
    const deliveryMetrics = await this.calculateDeliveryMetrics(
      locationDto.latitude,
      locationDto.longitude,
      activeDelivery.orderId
    );

    const trackingData = {
      ...locationDto,
      orderId: activeDelivery.orderId,
      ...deliveryMetrics
    };

    const tracking = this.deliveryTrackingRepository.create(trackingData);
    return await this.deliveryTrackingRepository.save(tracking);
  }

  async getDeliveryTracking(orderId: string): Promise<DeliveryTracking[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return await this.deliveryTrackingRepository.find({
      where: { orderId },
      relations: ['driver'],
      order: { createdAt: 'DESC' }
    });
  }

  async getActiveDeliveryTracking(orderId: string): Promise<DeliveryTracking | null> {
    const recentTracking = await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.orderId = :orderId', { orderId })
      .andWhere('tracking.createdAt > :recent', { recent: new Date(Date.now() - 30 * 60 * 1000) })
      .orderBy('tracking.createdAt', 'DESC')
      .getOne();

    return recentTracking;
  }

  // Delivery Assignment and Management
  async assignDelivery(assignmentDto: DeliveryAssignmentDto): Promise<{ tracking: DeliveryTracking, estimatedTime: number }> {
    const order = await this.orderRepository.findOne({
      where: { id: assignmentDto.orderId }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate initial delivery metrics
    const deliveryMetrics = await this.calculateDeliveryMetrics(
      assignmentDto.restaurantLatitude,
      assignmentDto.restaurantLongitude,
      assignmentDto.orderId
    );

    // Create initial tracking record - FIX: Create object without spreading deliveryMetrics first
    const trackingData: any = {
      orderId: assignmentDto.orderId,
      driverId: assignmentDto.driverId,
      latitude: assignmentDto.restaurantLatitude,
      longitude: assignmentDto.restaurantLongitude,
      status: 'assigned'
    };

    // Then assign delivery metrics separately
    Object.assign(trackingData, deliveryMetrics);

    const tracking = await this.createDeliveryTracking(trackingData);

    return {
      tracking,
      estimatedTime: deliveryMetrics.etaMinutes
    };
  }

  async findAvailableDrivers(searchDto: AvailableDriversDto): Promise<User[]> {
    const { latitude, longitude, radius } = searchDto;

    // Get all available drivers (online and available)
    const availableDrivers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.vehicleInfo', 'vehicleInfo')
      .where('user.role.name = :role', { role: 'Driver' })
      .andWhere('user.isOnline = :isOnline', { isOnline: true })
      .andWhere('user.isAvailable = :isAvailable', { isAvailable: true })
      .getMany();

    // In a real implementation, you would filter by distance using geographical calculations
    // For now, we'll return all available drivers
    return availableDrivers;
  }

  async calculateDeliveryEstimate(estimateDto: DeliveryEstimateDto): Promise<{
    distance: number;
    duration: number;
    polyline?: string;
  }> {
    const { restaurantLatitude, restaurantLongitude, customerLatitude, customerLongitude } = estimateDto;

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://maps.googleapis.com/maps/api/directions/json', {
          params: {
            origin: `${restaurantLatitude},${restaurantLongitude}`,
            destination: `${customerLatitude},${customerLongitude}`,
            key: this.googleMapsApiKey,
            mode: 'driving'
          }
        })
      );

      // FIX: Add proper typing for response data
      const responseData = response.data as any;
      
      if (responseData.status !== 'OK') {
        throw new Error('Google Maps API error: ' + responseData.status);
      }

      const route = responseData.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value / 1000, // Convert to km
        duration: leg.duration.value / 60, // Convert to minutes
        polyline: route.overview_polyline.points
      };
    } catch (error) {
      // Fallback calculation using Haversine formula
      const distance = this.calculateHaversineDistance(
        restaurantLatitude,
        restaurantLongitude,
        customerLatitude,
        customerLongitude
      );
      
      const duration = distance * 2; // Rough estimate: 2 minutes per km

      return {
        distance,
        duration,
        polyline: undefined
      };
    }
  }

  // Analytics and Reporting
  async getDriverDeliveryStats(driverId: string, startDate: string, endDate: string): Promise<{
    totalDeliveries: number;
    totalDistance: number;
    averageDeliveryTime: number;
    onTimeRate: number;
  }> {
    const deliveries = await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .leftJoinAndSelect('tracking.order', 'order')
      .where('tracking.driverId = :driverId', { driverId })
      .andWhere('tracking.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      })
      .getMany();

    // This would require more sophisticated calculations in a real implementation
    return {
      totalDeliveries: deliveries.length,
      totalDistance: 0, // Would calculate from tracking data
      averageDeliveryTime: 0, // Would calculate from order times
      onTimeRate: 0 // Would compare estimated vs actual delivery times
    };
  }

  async getDeliveryPerformance(restaurantId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const deliveries = await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .leftJoinAndSelect('tracking.order', 'order')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .andWhere('tracking.createdAt >= :startDate', { startDate })
      .getMany();

    // Calculate performance metrics
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
    const averageDeliveryTime = this.calculateAverageDeliveryTime(deliveries);

    return {
      totalDeliveries,
      completedDeliveries,
      completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
      averageDeliveryTime,
      deliveryTrends: this.analyzeDeliveryTrends(deliveries)
    };
  }

  // Real-time tracking for customers
  async getLiveDeliveryTracking(orderId: string): Promise<{
    currentLocation: { latitude: number; longitude: number };
    driver: { name: string; vehicle: string; phone: string };
    status: string;
    eta: number;
    distanceRemaining: number;
    polyline?: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['driver', 'restaurant', 'deliveryAddress']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const latestTracking = await this.getActiveDeliveryTracking(orderId);

    if (!latestTracking) {
      throw new NotFoundException('No active delivery tracking found');
    }

    // Get route polyline for map display
    const routeInfo = await this.calculateDeliveryEstimate({
      orderId,
      restaurantLatitude: order.restaurant.latitude,
      restaurantLongitude: order.restaurant.longitude,
      customerLatitude: order.deliveryAddress.latitude,
      customerLongitude: order.deliveryAddress.longitude
    });

    return {
      currentLocation: {
        latitude: latestTracking.latitude,
        longitude: latestTracking.longitude
      },
      driver: {
        name: order.driver.name,
        vehicle: `${order.driver.vehicleInfo?.vehicleMake} ${order.driver.vehicleInfo?.vehicleModel}`,
        phone: order.driver.phone
      },
      status: latestTracking.status || 'on_the_way',
      eta: latestTracking.etaMinutes || 0,
      distanceRemaining: latestTracking.distanceToDestination || 0,
      polyline: routeInfo.polyline
    };
  }

  // Helper methods
  private async calculateDeliveryMetrics(latitude: number, longitude: number, orderId: string): Promise<{
    distanceToDestination: number;
    etaMinutes: number;
    status: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'deliveryAddress']
    });

    if (!order || !order.deliveryAddress) {
      return {
        distanceToDestination: 0,
        etaMinutes: 0,
        status: 'unknown'
      };
    }

    const customerLat = order.deliveryAddress.latitude;
    const customerLng = order.deliveryAddress.longitude;

    const distance = this.calculateHaversineDistance(latitude, longitude, customerLat, customerLng);
    
    // Simple ETA calculation (2 minutes per km + 10 minutes for pickup)
    const eta = Math.round(distance * 2 + 10);

    // Determine status based on distance
    let status = 'on_the_way';
    if (distance < 1) status = 'nearby';
    if (distance < 0.1) status = 'arrived';

    return {
      distanceToDestination: distance,
      etaMinutes: eta,
      status
    };
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateAverageDeliveryTime(deliveries: DeliveryTracking[]): number {
    // Implementation would calculate average time from assignment to delivery
    return 30; // Mock value
  }

  private analyzeDeliveryTrends(deliveries: DeliveryTracking[]): any {
    // Implementation would analyze delivery patterns
    return {
      peakHours: ['12:00-14:00', '18:00-20:00'],
      averageDistance: 5.2,
      mostCommonVehicle: 'Motorcycle'
    };
  }
}