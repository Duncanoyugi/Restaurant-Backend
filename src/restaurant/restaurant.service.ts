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
import { StaffAssignment } from './entities/staff-assignment.entity';
import { DriverAssignment } from './entities/driver-assignment.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantStaffDto } from './dto/create-restaurant-staff.dto';
import { UpdateRestaurantStaffDto } from './dto/update-restaurant-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { RestaurantSearchDto } from './dto/restaurant-search.dto';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';
import { CreateDriverAssignmentDto } from './dto/create-driver-assignment.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(RestaurantStaff)
    private staffRepository: Repository<RestaurantStaff>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(StaffAssignment)
    private staffAssignmentRepository: Repository<StaffAssignment>,
    @InjectRepository(DriverAssignment)
    private driverAssignmentRepository: Repository<DriverAssignment>,
  ) { }

  // Restaurant CRUD operations
  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    // Check if email already exists
    const existingRestaurant = await this.restaurantRepository.findOne({
      where: { email: createRestaurantDto.email }
    });

    if (existingRestaurant) {
      throw new ConflictException('Restaurant with this email already exists');
    }

    // DTOs now use number types directly
    const restaurantData = {
      ...createRestaurantDto,
    };

    const restaurant = this.restaurantRepository.create(restaurantData);
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
      where.cityId = parseInt(cityId);
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

  async findOne(id: number): Promise<Restaurant> {
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
    const restaurant = await this.findOne(parseInt(id));

    // Check if email is being updated and if it already exists
    if (updateRestaurantDto.email && updateRestaurantDto.email !== restaurant.email) {
      const existingRestaurant = await this.restaurantRepository.findOne({
        where: { email: updateRestaurantDto.email }
      });

      if (existingRestaurant) {
        throw new ConflictException('Restaurant with this email already exists');
      }
    }

    // DTOs now use number types directly, no conversion needed

    Object.assign(restaurant, updateRestaurantDto);
    return await this.restaurantRepository.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(parseInt(id));
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

    // Convert string IDs to numbers
    const staffData = {
      ...createStaffDto,
      userId: createStaffDto.userId,
      restaurantId: createStaffDto.restaurantId
    };

    const staff = this.staffRepository.create(staffData);
    return await this.staffRepository.save(staff);
  }

  async findAllStaff(restaurantId: string): Promise<RestaurantStaff[]> {
    return await this.staffRepository.find({
      where: { restaurantId: parseInt(restaurantId), active: true },
      relations: ['user', 'restaurant'],
      order: { position: 'ASC', hireDate: 'DESC' }
    });
  }

  async findStaffById(id: string): Promise<RestaurantStaff> {
    const staff = await this.staffRepository.findOne({
      where: { id: parseInt(id) },
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
    const where: any = { staffId: parseInt(staffId) };

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
      .where('staff.restaurantId = :restaurantId', { restaurantId: parseInt(restaurantId) });

    if (date) {
      query.andWhere('shift.shiftDate = :date', { date });
    }

    return await query
      .orderBy('shift.shiftDate', 'DESC')
      .addOrderBy('shift.startTime', 'ASC')
      .getMany();
  }

  async updateShift(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({ where: { id: parseInt(id) } });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    // DTOs now use number types directly, no conversion needed

    Object.assign(shift, updateShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async removeShift(id: string): Promise<void> {
    const shift = await this.shiftRepository.findOne({ where: { id: parseInt(id) } });

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
    const restaurant = await this.findOne(parseInt(restaurantId));

    const [totalStaff, activeShifts, totalMenuItems] = await Promise.all([
      this.staffRepository.count({ where: { restaurantId: parseInt(restaurantId), active: true } }),
      this.shiftRepository.count({
        where: {
          staff: { restaurantId: parseInt(restaurantId) },
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
        cityId: parseInt(cityId),
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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  // Get default restaurant (for single restaurant system)
  async getDefaultRestaurant(): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { active: true },
      relations: ['city', 'city.state', 'city.state.country', 'owner'],
      order: { createdAt: 'ASC' } // Get the first created restaurant
    });

    if (!restaurant) {
      throw new NotFoundException('No active restaurant found. Please contact system administrator.');
    }

    return restaurant;
  }

  // Validate restaurant ownership
  async validateRestaurantOwnership(restaurantId: string, userId: string): Promise<boolean> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: parseInt(restaurantId), ownerId: parseInt(userId) }
    });
    return !!restaurant;
  }

  // Check if user is staff in restaurant
  async isUserStaffInRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    const staff = await this.staffRepository.findOne({
      where: { userId: parseInt(userId), restaurantId: parseInt(restaurantId), active: true }
    });
    return !!staff;
  }

  // Staff Assignment methods
  async createStaffAssignment(createStaffAssignmentDto: CreateStaffAssignmentDto): Promise<StaffAssignment> {
    // Check if user is already assigned to any restaurant as staff
    const existingAssignment = await this.staffAssignmentRepository.findOne({
      where: { staffId: parseInt(createStaffAssignmentDto.staffId) }
    });

    if (existingAssignment) {
      throw new ConflictException('User is already assigned as staff to a restaurant');
    }

    const staffAssignment = this.staffAssignmentRepository.create({
      ...createStaffAssignmentDto,
      staffId: parseInt(createStaffAssignmentDto.staffId),
      restaurantId: parseInt(createStaffAssignmentDto.restaurantId)
    });
    return await this.staffAssignmentRepository.save(staffAssignment);
  }

  async findStaffAssignmentsByRestaurant(restaurantId: string): Promise<StaffAssignment[]> {
    return await this.staffAssignmentRepository.find({
      where: { restaurantId: parseInt(restaurantId) },
      relations: ['staff', 'restaurant']
    });
  }

  async findStaffAssignmentById(id: string): Promise<StaffAssignment> {
    const assignment = await this.staffAssignmentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['staff', 'restaurant']
    });

    if (!assignment) {
      throw new NotFoundException(`Staff assignment with ID ${id} not found`);
    }

    return assignment;
  }

  async removeStaffAssignment(id: string): Promise<void> {
    const assignment = await this.findStaffAssignmentById(id);
    await this.staffAssignmentRepository.remove(assignment);
  }

  // Driver Assignment methods
  async createDriverAssignment(createDriverAssignmentDto: CreateDriverAssignmentDto): Promise<DriverAssignment> {
    // Check if user is already assigned to any restaurant as driver
    const existingAssignment = await this.driverAssignmentRepository.findOne({
      where: { driverId: parseInt(createDriverAssignmentDto.driverId) }
    });

    if (existingAssignment) {
      throw new ConflictException('User is already assigned as driver to a restaurant');
    }

    const driverAssignment = this.driverAssignmentRepository.create({
      ...createDriverAssignmentDto,
      driverId: parseInt(createDriverAssignmentDto.driverId),
      restaurantId: parseInt(createDriverAssignmentDto.restaurantId)
    });
    return await this.driverAssignmentRepository.save(driverAssignment);
  }

  async findDriverAssignmentsByRestaurant(restaurantId: string): Promise<DriverAssignment[]> {
    return await this.driverAssignmentRepository.find({
      where: { restaurantId: parseInt(restaurantId) },
      relations: ['driver', 'restaurant']
    });
  }

  async findDriverAssignmentById(id: string): Promise<DriverAssignment> {
    const assignment = await this.driverAssignmentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['driver', 'restaurant']
    });

    if (!assignment) {
      throw new NotFoundException(`Driver assignment with ID ${id} not found`);
    }

    return assignment;
  }

  async removeDriverAssignment(id: string): Promise<void> {
    const assignment = await this.findDriverAssignmentById(id);
    await this.driverAssignmentRepository.remove(assignment);
  }

  // Check if user is assigned to restaurant (staff or driver)
  async isUserAssignedToRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    const [staffAssignment, driverAssignment] = await Promise.all([
      this.staffAssignmentRepository.findOne({
        where: {
          staffId: parseInt(userId),
          restaurantId: parseInt(restaurantId)
        }
      }),
      this.driverAssignmentRepository.findOne({
        where: {
          driverId: parseInt(userId),
          restaurantId: parseInt(restaurantId)
        }
      })
    ]);

    return !!staffAssignment || !!driverAssignment;
  }
}