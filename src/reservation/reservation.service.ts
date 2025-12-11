// backend\src\reservation\reservation.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Reservation, ReservationType, ReservationStatus } from './entities/reservation.entity';
import { Table, TableStatus } from './entities/table.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { ReservationSearchDto } from './dto/reservation-search.dto';
import { TableSearchDto } from './dto/table-search.dto';
import { ReservationStatusDto } from './dto/reservation-status.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { TableAvailabilityDto } from './dto/table-availability.dto';
import { User } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/entities/user.types';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  // Helper method to check reservation access
  private async checkReservationAccess(user: User, reservationId: number): Promise<Reservation> {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId },
        relations: ['restaurant', 'restaurant.owner']
      });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    // Admin has access to all reservations
    if (user.role.name === UserRoleEnum.ADMIN) {
      return reservation;
    }

    // Customers can only access their own reservations
    if (user.role.name === UserRoleEnum.CUSTOMER && reservation.userId !== Number(user.id)) {
      throw new ForbiddenException('You can only access your own reservations');
    }

    // Restaurant owners and staff can only access reservations from their restaurant
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const hasAccess = await this.checkRestaurantAccess(user, String(reservation.restaurantId));
      if (!hasAccess) {
        throw new ForbiddenException('You can only access reservations from your restaurant');
      }
    }

    return reservation;
  }

  // Helper method to check restaurant access
  private async checkRestaurantAccess(user: User, restaurantId: string): Promise<boolean> {
    if (user.role.name === UserRoleEnum.ADMIN) {
      return true;
    }

    const restaurant = await this.restaurantRepository.findOne({
          where: { id: Number(restaurantId) },
          relations: ['owner', 'staff', 'staff.user']
        });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER && restaurant.owner.id === Number(user.id)) {
      return true;
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
          const isStaff = restaurant.staff.some(staff => staff.user.id === Number(user.id));
          return isStaff;
        }

    return false;
  }

  // Helper method to check table access
  private async checkTableAccess(user: User, tableId: number): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
      relations: ['restaurant', 'restaurant.owner']
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    // Admin has access to all tables
    if (user.role.name === UserRoleEnum.ADMIN) {
      return table;
    }

    // Restaurant owners and staff can only access tables from their restaurant
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const hasAccess = await this.checkRestaurantAccess(user, String(table.restaurantId));
      if (!hasAccess) {
        throw new ForbiddenException('You can only access tables from your restaurant');
      }
    }

    return table;
  }

  // Helper method to get user's restaurant ID
  private async getUserRestaurantId(user: User): Promise<string> {
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const restaurant = await this.restaurantRepository.findOne({
              where: { owner: { id: Number(user.id) } }
            });
      
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found for this user');
      }
      
      return String(restaurant.id);
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const staffRecord = await this.restaurantRepository
        .createQueryBuilder('restaurant')
        .innerJoin('restaurant.staff', 'staff')
        .where('staff.userId = :userId', { userId: Number(user.id) })
        .getOne();

      if (!staffRecord) {
        throw new ForbiddenException('You are not assigned to any restaurant');
      }

      return String(staffRecord.id);
    }

    throw new ForbiddenException('User does not have restaurant access');
  }

  // Table CRUD operations
  async createTable(createTableDto: CreateTableDto, user?: User): Promise<Table> {
    // Check permissions for creating tables
    if (user) {
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
        const hasAccess = await this.checkRestaurantAccess(user, String(createTableDto.restaurantId));
        if (!hasAccess) {
          throw new ForbiddenException('You can only create tables for your restaurant');
        }
      } else if (user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('Only administrators and restaurant owners can create tables');
      }
    }

    // Check if table number already exists in the restaurant
    const existingTable = await this.tableRepository.findOne({
      where: { 
        tableNumber: createTableDto.tableNumber,
        restaurantId: createTableDto.restaurantId
      }
    });

    if (existingTable) {
      throw new ConflictException('Table with this number already exists in this restaurant');
    }

    const table = this.tableRepository.create(createTableDto);
    return await this.tableRepository.save(table);
  }

  async findAllTables(searchDto: TableSearchDto): Promise<{ data: Table[], total: number }> {
    const { 
      restaurantId, 
      minCapacity, 
      location, 
      status,
      page = 1, 
      limit = 20 
    } = searchDto;
    
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Table> = {};

    if (restaurantId) {
      where.restaurantId = Number(restaurantId);
    }

    if (minCapacity !== undefined) {
      where.capacity = MoreThanOrEqual(minCapacity);
    }

    if (location) {
      where.location = Like(`%${location}%`);
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await this.tableRepository.findAndCount({
      where,
      relations: ['restaurant', 'reservations'],
      skip,
      take: limit,
      order: { 
        tableNumber: 'ASC'
      }
    });

    return { data, total };
  }

  async findTableById(id: number): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id },
      relations: ['restaurant', 'reservations', 'orders'],
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async updateTable(id: number, updateTableDto: UpdateTableDto, user?: User): Promise<Table> {
    const table = await this.findTableById(id);

    // Check permissions for updating tables
    if (user) {
      await this.checkTableAccess(user, id);
    }

    // Check if table number is being updated and if it already exists in the same restaurant
    if (updateTableDto.tableNumber && updateTableDto.tableNumber !== table.tableNumber) {
      const existingTable = await this.tableRepository.findOne({
        where: { 
          tableNumber: updateTableDto.tableNumber,
          restaurantId: updateTableDto.restaurantId || table.restaurantId
        }
      });

      if (existingTable) {
        throw new ConflictException('Table with this number already exists in this restaurant');
      }
    }

    Object.assign(table, updateTableDto);
    return await this.tableRepository.save(table);
  }

  async removeTable(id: number, user?: User): Promise<void> {
    const table = await this.findTableById(id);

    // Check permissions for deleting tables
    if (user) {
      await this.checkTableAccess(user, id);
    }
    
    // Check if table has active reservations
    const activeReservations = await this.reservationRepository.count({
      where: { 
        tableId: id,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED])
      }
    });

    if (activeReservations > 0) {
      throw new BadRequestException('Cannot delete table with active reservations');
    }

    await this.tableRepository.remove(table);
  }

  // Reservation CRUD operations
  async createReservation(createReservationDto: CreateReservationDto, user?: User): Promise<Reservation> {
    // Check permissions for creating reservations
    if (user) {
      // Customers can only create reservations for themselves
      if (user.role.name === UserRoleEnum.CUSTOMER && createReservationDto.userId !== Number(user.id)) {
        throw new ForbiddenException('You can only create reservations for yourself');
      }
    }

    // For table reservations, check table availability
    if (createReservationDto.tableId) {
      const table = await this.findTableById(Number(createReservationDto.tableId));
      
      // Check table capacity
      if (createReservationDto.guestCount > table.capacity) {
        throw new BadRequestException('Guest count exceeds table capacity');
      }

      // Check table availability for the time slot
      const isTableAvailable = await this.isTableAvailable(
        Number(createReservationDto.tableId),
        createReservationDto.reservationDate,
        createReservationDto.reservationTime
      );

      if (!isTableAvailable) {
        throw new ConflictException('Table is not available for the selected time');
      }
    }

    // Check restaurant capacity for full restaurant reservations
    if (createReservationDto.reservationType === ReservationType.FULL_RESTAURANT) {
      const isRestaurantAvailable = await this.isRestaurantAvailable(
        Number(createReservationDto.restaurantId),
        createReservationDto.reservationDate,
        createReservationDto.reservationTime,
        createReservationDto.guestCount
      );

      if (!isRestaurantAvailable) {
        throw new ConflictException('Restaurant is not available for the selected time and guest count');
      }
    }

    // Generate unique reservation number
    const reservationNumber = this.generateReservationNumber();

    const reservationData = {
      ...createReservationDto,
      reservationNumber,
      reservationDate: new Date(createReservationDto.reservationDate)
    };

    const reservation = this.reservationRepository.create(reservationData);
    const savedReservation = await this.reservationRepository.save(reservation);

    // Update table status if it's a table reservation
    if (savedReservation.tableId) {
      await this.tableRepository.update(savedReservation.tableId, {
        status: TableStatus.RESERVED
      });
    }

    return savedReservation;
  }

  async findAllReservations(searchDto: ReservationSearchDto, user?: User): Promise<{ data: Reservation[], total: number }> {
    const { 
      restaurantId, 
      userId, 
      tableId,
      startDate,
      endDate,
      status,
      page = 1, 
      limit = 20 
    } = searchDto;
    
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Reservation> = {};

    // Apply role-based filtering
    if (user) {
          if (user.role.name === UserRoleEnum.CUSTOMER) {
            where.userId = Number(user.id); // Customers can only see their own reservations
          } else if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
            const restaurantId = await this.getUserRestaurantId(user);
            where.restaurantId = Number(restaurantId);
          }
          // Admin can see all reservations (no additional filtering)
        }

    // Apply search filters (overriding role-based filters for admin)
    if (restaurantId && (user?.role.name === UserRoleEnum.ADMIN || await this.checkRestaurantAccess(user!, restaurantId))) {
      where.restaurantId = Number(restaurantId);
    }

    if (userId && (user?.role.name === UserRoleEnum.ADMIN || Number(user?.id) === Number(userId))) {
          where.userId = Number(userId);
        }

    if (tableId) {
          where.tableId = Number(tableId);
        }

    if (startDate && endDate) {
      where.reservationDate = Between(new Date(startDate), new Date(endDate));
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await this.reservationRepository.findAndCount({
      where,
      relations: ['restaurant', 'user', 'table', 'payment'],
      skip,
      take: limit,
      order: { 
        reservationDate: 'DESC',
        reservationTime: 'DESC'
      }
    });

    return { data, total };
  }

  async findReservationById(id: number, user?: User): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['restaurant', 'user', 'table', 'payment'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Check access permissions
    if (user) {
      await this.checkReservationAccess(user, id);
    }

    return reservation;
  }

  async findReservationByNumber(reservationNumber: string, user?: User): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationNumber },
      relations: ['restaurant', 'user', 'table', 'payment'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with number ${reservationNumber} not found`);
    }

    // Check access permissions
    if (user) {
      await this.checkReservationAccess(user, reservation.id);
    }

    return reservation;
  }

  async updateReservation(id: number, updateReservationDto: UpdateReservationDto, user?: User): Promise<Reservation> {
    const reservation = await this.findReservationById(id, user);

    // Check if user can update this reservation
    if (user) {
          if (user.role.name === UserRoleEnum.CUSTOMER && reservation.userId !== Number(user.id)) {
            throw new ForbiddenException('You can only update your own reservations');
          }
    
          if ((user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
            const hasAccess = await this.checkRestaurantAccess(user, String(reservation.restaurantId));
            if (!hasAccess) {
              throw new ForbiddenException('You can only update reservations from your restaurant');
            }
          }
        }

    // Prevent updates for completed or cancelled reservations
    if ([ReservationStatus.COMPLETED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW].includes(reservation.status)) {
      throw new BadRequestException('Cannot update completed, cancelled, or no-show reservation');
    }

    // If table or time is being updated, check availability
    if ((updateReservationDto.tableId || updateReservationDto.reservationDate || updateReservationDto.reservationTime) && 
        reservation.status !== ReservationStatus.COMPLETED) {
      
      const tableId = updateReservationDto.tableId || reservation.tableId;
      const reservationDate = updateReservationDto.reservationDate ? new Date(updateReservationDto.reservationDate) : reservation.reservationDate;
      const reservationTime = updateReservationDto.reservationTime || reservation.reservationTime;

      if (tableId) {
        const isTableAvailable = await this.isTableAvailable(
          Number(tableId),
          reservationDate.toISOString().split('T')[0],
          reservationTime,
          reservation.id // exclude current reservation
        );

        if (!isTableAvailable) {
          throw new ConflictException('Table is not available for the selected time');
        }
      }
    }

    Object.assign(reservation, updateReservationDto);
    const updatedReservation = await this.reservationRepository.save(reservation);

    return updatedReservation;
  }

  async updateReservationStatus(id: number, statusDto: ReservationStatusDto, user?: User): Promise<Reservation> {
    const reservation = await this.findReservationById(id, user);

    // Check if user can update reservation status
    if (user) {
      if ((user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
        const hasAccess = await this.checkRestaurantAccess(user, String(reservation.restaurantId));
        if (!hasAccess) {
          throw new ForbiddenException('You can only update reservation status for your restaurant');
        }
      } else if (user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('Only administrators and restaurant users can update reservation status');
      }
    }

    // Validate status transitions
    this.validateStatusTransition(reservation.status, statusDto.status);

    // Handle table status changes
    if (reservation.tableId) {
      await this.handleTableStatusChange(Number(reservation.tableId), statusDto.status);
    }

    reservation.status = statusDto.status;
    return await this.reservationRepository.save(reservation);
  }

  async cancelReservation(id: number, performedBy?: string, user?: User): Promise<Reservation> {
    const reservation = await this.findReservationById(id, user);

    // Check if user can cancel this reservation
    if (user) {
          if (user.role.name === UserRoleEnum.CUSTOMER && reservation.userId !== Number(user.id)) {
            throw new ForbiddenException('You can only cancel your own reservations');
          }
    
          if ((user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
            const hasAccess = await this.checkRestaurantAccess(user, String(reservation.restaurantId));
            if (!hasAccess) {
              throw new ForbiddenException('You can only cancel reservations from your restaurant');
            }
          }
        }

    // Only allow cancellation for pending or confirmed reservations
    if (![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(reservation.status)) {
      throw new BadRequestException('Cannot cancel reservation in current status');
    }

    // Free up the table if it was reserved
    if (reservation.tableId) {
      await this.tableRepository.update(reservation.tableId, {
        status: TableStatus.AVAILABLE
      });
    }

    reservation.status = ReservationStatus.CANCELLED;
    return await this.reservationRepository.save(reservation);
  }

  // Availability endpoints - Public access
  async checkAvailability(availabilityDto: AvailabilityCheckDto): Promise<{ 
    available: boolean, 
    availableTables?: Table[],
    message?: string 
  }> {
    const { restaurantId, reservationDate, reservationTime, guestCount, duration } = availabilityDto;

    const availableTables = await this.findAvailableTables({
      restaurantId,
      reservationDate,
      reservationTime,
      guestCount,
      duration
    });

    if (availableTables.length === 0) {
      return { 
        available: false, 
        message: 'No available tables for the selected time and guest count' 
      };
    }

    return { 
      available: true, 
      availableTables 
    };
  }

  async findAvailableTables(availabilityDto: TableAvailabilityDto): Promise<Table[]> {
    const { restaurantId, reservationDate, reservationTime, guestCount, duration } = availabilityDto;

    // Get all tables for the restaurant that can accommodate the guest count
    const tables = await this.tableRepository.find({
      where: { 
        restaurantId,
        capacity: MoreThanOrEqual(guestCount),
        status: TableStatus.AVAILABLE
      },
      relations: ['reservations']
    });

    const availableTables: Table[] = [];

    for (const table of tables) {
      const isAvailable = await this.isTableAvailable(
        Number(table.id),
        reservationDate,
        reservationTime,
        undefined,
        duration
      );

      if (isAvailable) {
        availableTables.push(table);
      }
    }

    return availableTables;
  }

  // Analytics and Reporting
  async getReservationStats(restaurantId: number, startDate: string, endDate: string, user?: User): Promise<{
    total: number,
    confirmed: number,
    completed: number,
    cancelled: number,
    noShow: number,
    occupancyRate: number
  }> {
    // Check restaurant access
    if (user) {
          const hasAccess = await this.checkRestaurantAccess(user, String(restaurantId));
          if (!hasAccess && user.role.name !== UserRoleEnum.ADMIN) {
            throw new ForbiddenException('You can only access statistics for your restaurant');
          }
        }

    const reservations = await this.reservationRepository.find({
      where: {
            restaurantId: Number(restaurantId),
            reservationDate: Between(new Date(startDate), new Date(endDate))
          }
    });

    const stats = {
      total: reservations.length,
      confirmed: reservations.filter(r => r.status === ReservationStatus.CONFIRMED).length,
      completed: reservations.filter(r => r.status === ReservationStatus.COMPLETED).length,
      cancelled: reservations.filter(r => r.status === ReservationStatus.CANCELLED).length,
      noShow: reservations.filter(r => r.status === ReservationStatus.NO_SHOW).length,
      occupancyRate: 0
    };

    // Calculate occupancy rate (completed / (completed + cancelled + noShow))
    const relevantReservations = stats.completed + stats.cancelled + stats.noShow;
    stats.occupancyRate = relevantReservations > 0 ? 
      (stats.completed / relevantReservations) * 100 : 0;

    return stats;
  }

  async getUpcomingReservations(restaurantId: number, hours: number = 24, user?: User): Promise<Reservation[]> {
    // Check restaurant access
    if (user) {
          const hasAccess = await this.checkRestaurantAccess(user, String(restaurantId));
          if (!hasAccess && user.role.name !== UserRoleEnum.ADMIN) {
            throw new ForbiddenException('You can only access upcoming reservations for your restaurant');
          }
        }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + hours);

    return await this.reservationRepository.find({
      where: {
        restaurantId,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        reservationDate: Between(startDate, endDate)
      },
      relations: ['user', 'table'],
      order: { 
        reservationDate: 'ASC',
        reservationTime: 'ASC'
      }
    });
  }

  async getDailyReservations(restaurantId: number, date: string, user?: User): Promise<Reservation[]> {
    // Check restaurant access
    if (user) {
          const hasAccess = await this.checkRestaurantAccess(user, String(restaurantId));
          if (!hasAccess && user.role.name !== UserRoleEnum.ADMIN) {
            throw new ForbiddenException('You can only access daily reservations for your restaurant');
          }
        }

    const targetDate = new Date(date);

    return await this.reservationRepository.find({
      where: {
        restaurantId,
        reservationDate: targetDate,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED])
      },
      relations: ['user', 'table'],
      order: { 
        reservationTime: 'ASC'
      }
    });
  }

  // New methods for user-specific access
  async getMyRestaurantReservations(user: User): Promise<{ data: Reservation[], total: number }> {
    const restaurantId = await this.getUserRestaurantId(user);
    
    const searchDto: ReservationSearchDto = {
      restaurantId,
      page: 1,
      limit: 50
    };

    return this.findAllReservations(searchDto, user);
  }

  async getMyRestaurantTables(user: User): Promise<{ data: Table[], total: number }> {
    const restaurantId = await this.getUserRestaurantId(user);
    
    const searchDto: TableSearchDto = {
      restaurantId,
      page: 1,
      limit: 50
    };

    return this.findAllTables(searchDto);
  }

  // Existing helper methods (keep the same logic)
  private async isTableAvailable(
      tableId: number,
      reservationDate: string,
      reservationTime: string,
      excludeReservationId?: number,
      duration: number = 120
    ): Promise<boolean> {
    const conflictingReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.tableId = :tableId', { tableId })
      .andWhere('reservation.status IN (:...statuses)', { 
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] 
      })
      .andWhere('reservation.reservationDate = :reservationDate', { reservationDate })
      .andWhere('(reservation.reservationTime BETWEEN :startTime AND :endTime OR :reservationTime BETWEEN reservation.reservationTime AND DATEADD(MINUTE, :duration, reservation.reservationTime))')
      .setParameters({
        reservationDate,
        reservationTime,
        startTime: this.calculateStartTime(reservationTime, duration),
        endTime: this.calculateEndTime(reservationTime, duration),
        duration
      });

    if (excludeReservationId) {
      conflictingReservations.andWhere('reservation.id != :excludeReservationId', { excludeReservationId });
    }

    const count = await conflictingReservations.getCount();
    return count === 0;
  }

  private async isRestaurantAvailable(
      restaurantId: number,
      reservationDate: string,
      reservationTime: string,
      guestCount: number
    ): Promise<boolean> {
    // Get total capacity of available tables
    const availableTables = await this.findAvailableTables({
          restaurantId: restaurantId,
          reservationDate,
          reservationTime,
          guestCount: 1, // Minimum capacity
          duration: 120
        });

    const totalCapacity = availableTables.reduce((sum, table) => sum + table.capacity, 0);

    return totalCapacity >= guestCount;
  }

  private calculateStartTime(reservationTime: string, duration: number): string {
    const [hours, minutes] = reservationTime.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes - duration, 0, 0);
    return startTime.toTimeString().slice(0, 8);
  }

  private calculateEndTime(reservationTime: string, duration: number): string {
    const [hours, minutes] = reservationTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes + duration, 0, 0);
    return endTime.toTimeString().slice(0, 8);
  }

  private generateReservationNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RSV${timestamp}${random}`;
  }

  private validateStatusTransition(currentStatus: ReservationStatus, newStatus: ReservationStatus): void {
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.NO_SHOW]: []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async handleTableStatusChange(tableId: number, newStatus: ReservationStatus): Promise<void> {
    const tableStatusMap: Partial<Record<ReservationStatus, TableStatus>> = {
      [ReservationStatus.CONFIRMED]: TableStatus.RESERVED,
      [ReservationStatus.COMPLETED]: TableStatus.AVAILABLE,
      [ReservationStatus.CANCELLED]: TableStatus.AVAILABLE,
      [ReservationStatus.NO_SHOW]: TableStatus.AVAILABLE
    };

    const newTableStatus = tableStatusMap[newStatus];
    if (newTableStatus) {
      await this.tableRepository.update(tableId, { status: newTableStatus });
    }
  }
}