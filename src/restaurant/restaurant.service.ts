import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantStaff } from './entities/restaurant-staff.entity';
import { Shift } from './entities/shift.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantStaffDto } from './dto/create-restaurant-staff.dto';
import { UpdateRestaurantStaffDto } from './dto/update-restaurant-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { RestaurantSearchDto } from './dto/restaurant-search.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(RestaurantStaff)
    private staffRepository: Repository<RestaurantStaff>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
  ) {}

  // Restaurant CRUD operations
  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    // Check if email already exists
    const existingRestaurant = await this.restaurantRepository.findOne({
      where: { email: createRestaurantDto.email }
    });

    if (existingRestaurant) {
      throw new ConflictException('Restaurant with this email already exists');
    }

    const restaurant = this.restaurantRepository.create(createRestaurantDto);
    return await this.restaurantRepository.save(restaurant);
  }

  async findAll(searchDto: RestaurantSearchDto): Promise<{ data: Restaurant[], total: number }> {
    const { name, cityId, minRating, active, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (cityId) {
      where.cityId = cityId;
    }

    if (minRating !== undefined) {
      where.averageRating = Between(minRating, 5);
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await this.restaurantRepository.findAndCount({
      where,
      relations: ['city', 'city.state', 'city.state.country', 'owner'],
      skip,
      take: limit,
      order: { averageRating: 'DESC', createdAt: 'DESC' }
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: [
        'city', 
        'city.state', 
        'city.state.country', 
        'owner',
        'staff',
        'staff.user'
      ],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateRestaurantDto.email && updateRestaurantDto.email !== restaurant.email) {
      const existingRestaurant = await this.restaurantRepository.findOne({
        where: { email: updateRestaurantDto.email }
      });

      if (existingRestaurant) {
        throw new ConflictException('Restaurant with this email already exists');
      }
    }

    Object.assign(restaurant, updateRestaurantDto);
    return await this.restaurantRepository.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    await this.restaurantRepository.softRemove(restaurant);
  }

  // Restaurant Staff operations
  async createStaff(createStaffDto: CreateRestaurantStaffDto): Promise<RestaurantStaff> {
    // Check if user is already staff in any restaurant
    const existingStaff = await this.staffRepository.findOne({
      where: { userId: createStaffDto.userId },
      relations: ['user']
    });

    if (existingStaff) {
      throw new ConflictException('User is already staff in a restaurant');
    }

    const staff = this.staffRepository.create(createStaffDto);
    return await this.staffRepository.save(staff);
  }

  async findAllStaff(restaurantId: string): Promise<RestaurantStaff[]> {
    return await this.staffRepository.find({
      where: { restaurantId, active: true },
      relations: ['user', 'restaurant'],
      order: { position: 'ASC', hireDate: 'DESC' }
    });
  }

  async findStaffById(id: string): Promise<RestaurantStaff> {
    const staff = await this.staffRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'shifts']
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return staff;
  }

  async updateStaff(id: string, updateStaffDto: UpdateRestaurantStaffDto): Promise<RestaurantStaff> {
    const staff = await this.findStaffById(id);
    Object.assign(staff, updateStaffDto);
    return await this.staffRepository.save(staff);
  }

  async removeStaff(id: string): Promise<void> {
    const staff = await this.findStaffById(id);
    await this.staffRepository.remove(staff);
  }

  // Shift operations
  async createShift(createShiftDto: CreateShiftDto): Promise<Shift> {
    // Check for shift conflicts
    const conflictingShift = await this.shiftRepository
      .createQueryBuilder('shift')
      .where('shift.staffId = :staffId', { staffId: createShiftDto.staffId })
      .andWhere('shift.shiftDate = :shiftDate', { 
        shiftDate: new Date(createShiftDto.shiftDate).toISOString().split('T')[0] 
      })
      .andWhere('(shift.startTime BETWEEN :start AND :end OR shift.endTime BETWEEN :start AND :end)')
      .setParameters({
        start: createShiftDto.startTime,
        end: createShiftDto.endTime
      })
      .getOne();

    if (conflictingShift) {
      throw new ConflictException('Staff member already has a shift during this time');
    }

    const shift = this.shiftRepository.create(createShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async findShiftsByStaff(staffId: string, startDate?: string, endDate?: string): Promise<Shift[]> {
    const where: any = { staffId };

    if (startDate && endDate) {
      where.shiftDate = Between(startDate, endDate);
    }

    return await this.shiftRepository.find({
      where,
      relations: ['staff', 'staff.user'],
      order: { shiftDate: 'DESC', startTime: 'ASC' }
    });
  }

  async findShiftsByRestaurant(restaurantId: string, date?: string): Promise<Shift[]> {
    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('staff.restaurantId = :restaurantId', { restaurantId });

    if (date) {
      query.andWhere('shift.shiftDate = :date', { date });
    }

    return await query
      .orderBy('shift.shiftDate', 'DESC')
      .addOrderBy('shift.startTime', 'ASC')
      .getMany();
  }

  async updateShift(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({ where: { id } });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    Object.assign(shift, updateShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async removeShift(id: string): Promise<void> {
    const shift = await this.shiftRepository.findOne({ where: { id } });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    await this.shiftRepository.remove(shift);
  }

  // Kenya-specific restaurant features
  async findRestaurantsNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Restaurant[]> {
    // Simplified distance calculation - in production, use PostGIS or similar
    const restaurants = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.city', 'city')
      .leftJoinAndSelect('city.state', 'state')
      .leftJoinAndSelect('state.country', 'country')
      .where('restaurant.active = :active', { active: true })
      .andWhere('restaurant.latitude IS NOT NULL')
      .andWhere('restaurant.longitude IS NOT NULL')
      .getMany();

    // Filter restaurants within radius
    return restaurants.filter(restaurant => {
      if (!restaurant.latitude || !restaurant.longitude) return false;
      
      const distance = this.calculateDistance(
        latitude,
        longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      
      return distance <= radiusKm;
    });
  }

  async getRestaurantStatistics(restaurantId: string): Promise<any> {
    const restaurant = await this.findOne(restaurantId);

    const [totalStaff, activeShifts, totalMenuItems] = await Promise.all([
      this.staffRepository.count({ where: { restaurantId, active: true } }),
      this.shiftRepository.count({ 
        where: { 
          staff: { restaurantId },
          status: 'Scheduled'
        } 
      }),
      // This would come from menu module
      Promise.resolve(0) // Placeholder for menu items count
    ]);

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        rating: restaurant.averageRating
      },
      statistics: {
        totalStaff,
        activeShifts,
        totalMenuItems,
        operationalHours: `${restaurant.openingTime} - ${restaurant.closingTime}`
      }
    };
  }

  async getPopularRestaurantsInCity(cityId: string, limit: number = 10): Promise<Restaurant[]> {
    return await this.restaurantRepository.find({
      where: { 
        cityId, 
        active: true 
      },
      relations: ['city', 'owner'],
      order: { averageRating: 'DESC', createdAt: 'DESC' },
      take: limit
    });
  }

  // Helper methods
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

  // Validate restaurant ownership
  async validateRestaurantOwnership(restaurantId: string, userId: string): Promise<boolean> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, ownerId: userId }
    });
    return !!restaurant;
  }

  // Check if user is staff in restaurant
  async isUserStaffInRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    const staff = await this.staffRepository.findOne({
      where: { userId, restaurantId, active: true }
    });
    return !!staff;
  }
}