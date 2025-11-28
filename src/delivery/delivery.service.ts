// backend\src\delivery\delivery.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, MoreThan, LessThan } from 'typeorm';
import { DeliveryTracking } from './entities/delivery-tracking.entity';
import { VehicleInfo } from './entities/vehicle-info.entity';
import { Order } from '../order/entities/order.entity';
import { User, UserStatus } from '../user/entities/user.entity';
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
import { UserRoleEnum } from '../user/entities/user.types';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
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
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.googleMapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
  }

  // ==================== ROLE VALIDATION METHODS ====================

  private validateDriverAccess(user: User, targetDriverId?: string): void {
    if (user.role.name !== UserRoleEnum.ADMIN && targetDriverId && targetDriverId !== user.id) {
      throw new ForbiddenException('You can only access your own driver data');
    }
  }

  private async validateRestaurantAccess(user: User, restaurantId?: string): Promise<void> {
    if (user.role.name === UserRoleEnum.ADMIN) {
      return; // Admin has access to all restaurants
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const userRestaurantId = await this.getUserRestaurantId(user);
      if (!userRestaurantId) {
        throw new ForbiddenException('Restaurant association required');
      }
      if (restaurantId && userRestaurantId !== restaurantId) {
        throw new ForbiddenException('Access to this restaurant denied');
      }
    }
  }

  private async getUserRestaurantId(user: User): Promise<string | null> {
    // For restaurant owners
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER && user.ownedRestaurants?.length > 0) {
      return user.ownedRestaurants[0].id;
    }

    // For restaurant staff
    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF && user.restaurantStaff) {
      return user.restaurantStaff.restaurantId;
    }

    return null;
  }

  private async validateOrderAccess(user: User, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'restaurant', 'driver']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Admin can access all orders
    if (user.role.name === UserRoleEnum.ADMIN) {
      return order;
    }

    // Restaurant owners/staff can access their restaurant's orders
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const userRestaurantId = await this.getUserRestaurantId(user);
      if (userRestaurantId === order.restaurantId) {
        return order;
      }
    }

    // Customers can access their own orders
    if (user.role.name === UserRoleEnum.CUSTOMER && order.userId === user.id) {
      return order;
    }

    // Drivers can access orders assigned to them
    if (user.role.name === UserRoleEnum.DRIVER && order.driverId === user.id) {
      return order;
    }

    throw new ForbiddenException('Access to this order denied');
  }

  // ==================== VEHICLE INFO CRUD OPERATIONS ====================

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

  // ==================== DELIVERY TRACKING OPERATIONS ====================

  async createDeliveryTracking(createTrackingDto: CreateDeliveryTrackingDto, user: User): Promise<DeliveryTracking> {
    // Verify order exists and user has access
    const order = await this.validateOrderAccess(user, createTrackingDto.orderId);

    // Verify driver exists and is a driver
    const driver = await this.userRepository.findOne({
      where: { 
        id: createTrackingDto.driverId,
        role: { name: UserRoleEnum.DRIVER }
      },
      relations: ['role']
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Restaurant staff/owners can only create tracking for their restaurant's orders
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const userRestaurantId = await this.getUserRestaurantId(user);
      if (order.restaurantId !== userRestaurantId) {
        throw new ForbiddenException('You can only create tracking for your restaurant orders');
      }
    }

    const tracking = this.deliveryTrackingRepository.create(createTrackingDto);
    return await this.deliveryTrackingRepository.save(tracking);
  }

  async updateDriverLocation(locationDto: DriverLocationDto): Promise<DeliveryTracking> {
    // Find active delivery for this driver
    const activeDelivery = await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.driverId = :driverId', { driverId: locationDto.driverId })
      .andWhere('tracking.createdAt > :recent', { recent: new Date(Date.now() - 30 * 60 * 1000) })
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

  async getDeliveryTracking(orderId: string, user: User): Promise<DeliveryTracking[]> {
    // Validate order access
    await this.validateOrderAccess(user, orderId);

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

  // ==================== DELIVERY ASSIGNMENT AND MANAGEMENT ====================

  async assignDelivery(assignmentDto: DeliveryAssignmentDto, user: User): Promise<{ tracking: DeliveryTracking, estimatedTime: number }> {
    const order = await this.validateOrderAccess(user, assignmentDto.orderId);

    // Verify driver exists and is available
    const driver = await this.userRepository.findOne({
      where: { 
        id: assignmentDto.driverId,
        role: { name: UserRoleEnum.DRIVER },
        isOnline: true,
        isAvailable: true,
        status: UserStatus.ACTIVE
      },
      relations: ['role', 'vehicleInfo']
    });

    if (!driver) {
      throw new BadRequestException('Driver not available or not found');
    }

    // Restaurant staff/owners can only assign deliveries for their restaurant
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const userRestaurantId = await this.getUserRestaurantId(user);
      if (order.restaurantId !== userRestaurantId) {
        throw new ForbiddenException('You can only assign deliveries for your restaurant');
      }
    }

    // Calculate initial delivery metrics
    const deliveryMetrics = await this.calculateDeliveryMetrics(
      assignmentDto.restaurantLatitude,
      assignmentDto.restaurantLongitude,
      assignmentDto.orderId
    );

    const trackingData: any = {
      orderId: assignmentDto.orderId,
      driverId: assignmentDto.driverId,
      latitude: assignmentDto.restaurantLatitude,
      longitude: assignmentDto.restaurantLongitude,
      ...deliveryMetrics,
      status: 'assigned'
    };

    const tracking = await this.createDeliveryTracking(trackingData, user);

    // Update order with driver assignment
    await this.orderRepository.update(assignmentDto.orderId, {
      driverId: assignmentDto.driverId
    });

    return {
      tracking,
      estimatedTime: deliveryMetrics.etaMinutes
    };
  }

  async findAvailableDrivers(searchDto: AvailableDriversDto, user: User): Promise<User[]> {
    // Only admin and restaurant staff/owners can find available drivers
    if (user.role.name !== UserRoleEnum.ADMIN && 
        user.role.name !== UserRoleEnum.RESTAURANT_OWNER && 
        user.role.name !== UserRoleEnum.RESTAURANT_STAFF) {
      throw new ForbiddenException('Insufficient permissions to access driver information');
    }

    const { latitude, longitude, radius } = searchDto;

    // Get all available drivers (online and available)
    const availableDrivers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.vehicleInfo', 'vehicleInfo')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :role', { role: UserRoleEnum.DRIVER })
      .andWhere('user.isOnline = :isOnline', { isOnline: true })
      .andWhere('user.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getMany();

    // In a real implementation, you would filter by distance using geographical calculations
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

  // ==================== ANALYTICS AND REPORTING ====================

  async getDriverDeliveryStats(driverId: string, startDate: string, endDate: string, user: User): Promise<{
    totalDeliveries: number;
    totalDistance: number;
    averageDeliveryTime: number;
    onTimeRate: number;
    totalEarnings?: number;
  }> {
    // Validate driver access
    this.validateDriverAccess(user, driverId);

    const deliveries = await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .leftJoinAndSelect('tracking.order', 'order')
      .where('tracking.driverId = :driverId', { driverId })
      .andWhere('tracking.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      })
      .getMany();

    // Calculate basic stats
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
    
    // Mock calculations - replace with actual logic
    const totalDistance = deliveries.reduce((sum, delivery) => sum + (delivery.distanceToDestination || 0), 0);
    const averageDeliveryTime = totalDeliveries > 0 ? 30 : 0; // Mock average
    const onTimeRate = completedDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

    const result: any = {
      totalDeliveries,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      averageDeliveryTime,
      onTimeRate: parseFloat(onTimeRate.toFixed(2))
    };

    // Only include earnings for the driver themselves or admin
    if (user.role.name === UserRoleEnum.ADMIN || user.id === driverId) {
      result.totalEarnings = totalDeliveries * 150; // Mock earnings calculation
    }

    return result;
  }

  async getDeliveryPerformance(restaurantId: string, days: number = 7, user: User): Promise<any> {
    // Validate restaurant access
    await this.validateRestaurantAccess(user, restaurantId);

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
      deliveryTrends: this.analyzeDeliveryTrends(deliveries),
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        days
      }
    };
  }

  // ==================== REAL-TIME TRACKING ====================

  async getLiveDeliveryTracking(orderId: string, user: User): Promise<{
    currentLocation: { latitude: number; longitude: number };
    driver: { name: string; vehicle: string; phone: string };
    status: string;
    eta: number;
    distanceRemaining: number;
    polyline?: string;
  }> {
    const order = await this.validateOrderAccess(user, orderId);

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
        vehicle: order.driver.vehicleInfo ? 
          `${order.driver.vehicleInfo.vehicleMake} ${order.driver.vehicleInfo.vehicleModel}` : 'Vehicle not specified',
        phone: order.driver.phone
      },
      status: latestTracking.status || 'on_the_way',
      eta: latestTracking.etaMinutes || 0,
      distanceRemaining: latestTracking.distanceToDestination || 0,
      polyline: routeInfo.polyline
    };
  }

  // ==================== DRIVER-SPECIFIC METHODS ====================

  async getActiveDeliveriesForDriver(driverId: string, user: User): Promise<DeliveryTracking[]> {
    this.validateDriverAccess(user, driverId);

    return await this.deliveryTrackingRepository
      .createQueryBuilder('tracking')
      .leftJoinAndSelect('tracking.order', 'order')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.deliveryAddress', 'deliveryAddress')
      .where('tracking.driverId = :driverId', { driverId })
      .andWhere('tracking.createdAt > :recent', { recent: new Date(Date.now() - 24 * 60 * 60 * 1000) }) // Last 24 hours
      .andWhere('tracking.status IN (:...statuses)', { 
        statuses: ['assigned', 'picked_up', 'on_the_way', 'nearby'] 
      })
      .orderBy('tracking.createdAt', 'DESC')
      .getMany();
  }

  // ==================== HELPER METHODS ====================

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
      distanceToDestination: parseFloat(distance.toFixed(2)),
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
    if (deliveries.length === 0) return 0;
    
    // Mock implementation - calculate average time from assignment to delivery
    // In real implementation, you would calculate actual time differences
    return 30;
  }

  private analyzeDeliveryTrends(deliveries: DeliveryTracking[]): any {
    if (deliveries.length === 0) {
      return {
        peakHours: [],
        averageDistance: 0,
        mostCommonVehicle: 'No data'
      };
    }

    // Mock analysis - implement actual trend analysis
    return {
      peakHours: ['12:00-14:00', '18:00-20:00'],
      averageDistance: 5.2,
      mostCommonVehicle: 'Motorcycle'
    };
  }
}