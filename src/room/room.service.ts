import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomBooking, RoomBookingStatus } from './entities/room-booking.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomBookingDto } from './dto/create-room-booking.dto';
import { UpdateRoomBookingDto } from './dto/update-room-booking.dto';
import { RoomSearchDto } from './dto/room-search.dto';
import { BookingSearchDto } from './dto/booking-search.dto';
import { BookingStatusDto } from './dto/booking-status.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(RoomBooking)
    private roomBookingRepository: Repository<RoomBooking>,
  ) {}

  // In backend\src\room\room.service.ts
// Fix the createRoom method

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    // Check if room with same name already exists in the restaurant
    const existingRoom = await this.roomRepository.findOne({
      where: { 
        name: createRoomDto.name,
        restaurantId: createRoomDto.restaurantId
      }
    });

    if (existingRoom) {
      throw new ConflictException('Room with this name already exists in this restaurant');
    }

    // Create room with amenities and imageGallery as JSON strings
    const roomData: Partial<Room> = {
      name: createRoomDto.name,
      description: createRoomDto.description,
      restaurantId: createRoomDto.restaurantId,
      capacity: createRoomDto.capacity,
      pricePerNight: createRoomDto.pricePerNight,
      available: createRoomDto.available !== undefined ? createRoomDto.available : true,
      amenities: createRoomDto.amenities ? JSON.stringify(createRoomDto.amenities) : '',
      imageGallery: createRoomDto.imageGallery ? JSON.stringify(createRoomDto.imageGallery) : '',
    };

    const room = this.roomRepository.create(roomData);
    const savedRoom = await this.roomRepository.save(room);
    
    // FIX: Ensure we're working with a single Room, not an array
    const roomEntity = Array.isArray(savedRoom) ? savedRoom[0] : savedRoom;
    return this.parseRoomData(roomEntity);
  }

  async findAllRooms(searchDto: RoomSearchDto): Promise<{ data: Room[], total: number }> {
    const { 
      restaurantId, 
      minCapacity, 
      maxPrice, 
      available,
      checkInDate,
      checkOutDate,
      guests,
      page = 1, 
      limit = 20 
    } = searchDto;
    
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Room> = { restaurantId };

    if (minCapacity !== undefined) {
      where.capacity = MoreThanOrEqual(minCapacity);
    }

    if (maxPrice !== undefined) {
      where.pricePerNight = LessThanOrEqual(maxPrice);
    }

    if (available !== undefined) {
      where.available = available;
    }

    const [data, total] = await this.roomRepository.findAndCount({
      where,
      relations: ['restaurant', 'bookings'],
      skip,
      take: limit,
      order: { 
        pricePerNight: 'ASC',
        capacity: 'DESC'
      }
    });

    // Parse amenities and imageGallery from JSON strings
    const parsedData = data.map(room => this.parseRoomData(room));

    // Filter available rooms based on dates if provided
    let filteredData = parsedData;
    if (checkInDate && checkOutDate) {
      filteredData = await this.filterAvailableRooms(parsedData, checkInDate, checkOutDate, guests);
    }

    return { data: filteredData, total: filteredData.length };
  }

  async findRoomById(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['restaurant', 'bookings', 'bookings.user'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return this.parseRoomData(room);
  }

  async updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findRoomById(id);

    // Check if name is being updated and if it already exists in the same restaurant
    if (updateRoomDto.name && updateRoomDto.name !== room.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: { 
          name: updateRoomDto.name,
          restaurantId: updateRoomDto.restaurantId || room.restaurantId
        }
      });

      if (existingRoom) {
        throw new ConflictException('Room with this name already exists in this restaurant');
      }
    }

    // Handle amenities and imageGallery serialization
    const updateData: any = { ...updateRoomDto };
    if (updateRoomDto.amenities) {
      updateData.amenities = JSON.stringify(updateRoomDto.amenities);
    }
    if (updateRoomDto.imageGallery) {
      updateData.imageGallery = JSON.stringify(updateRoomDto.imageGallery);
    }

    Object.assign(room, updateData);
    const updatedRoom = await this.roomRepository.save(room);

    return this.parseRoomData(updatedRoom);
  }

  async removeRoom(id: string): Promise<void> {
    const room = await this.findRoomById(id);
    
    // Check if room has active bookings
    const activeBookings = await this.roomBookingRepository.count({
      where: { 
        roomId: id,
        status: In([RoomBookingStatus.PENDING, RoomBookingStatus.CONFIRMED, RoomBookingStatus.CHECKED_IN])
      }
    });

    if (activeBookings > 0) {
      throw new BadRequestException('Cannot delete room with active bookings');
    }

    await this.roomRepository.remove(room);
  }

  // Room Booking operations
  async createRoomBooking(createBookingDto: CreateRoomBookingDto): Promise<RoomBooking> {
    const room = await this.findRoomById(createBookingDto.roomId);

    // Check room availability
    const isAvailable = await this.isRoomAvailable(
      createBookingDto.roomId,
      createBookingDto.checkInDate,
      createBookingDto.checkOutDate
    );

    if (!isAvailable) {
      throw new ConflictException('Room is not available for the selected dates');
    }

    // Check capacity
    if (createBookingDto.numberOfGuests > room.capacity) {
      throw new BadRequestException('Number of guests exceeds room capacity');
    }

    // Generate unique booking number
    const bookingNumber = this.generateBookingNumber();

    const bookingData = {
      ...createBookingDto,
      bookingNumber,
      checkInDate: new Date(createBookingDto.checkInDate),
      checkOutDate: new Date(createBookingDto.checkOutDate)
    };

    const booking = this.roomBookingRepository.create(bookingData);
    return await this.roomBookingRepository.save(booking);
  }

  async findAllBookings(searchDto: BookingSearchDto): Promise<{ data: RoomBooking[], total: number }> {
    const { 
      roomId, 
      userId, 
      restaurantId,
      startDate,
      endDate,
      status,
      page = 1, 
      limit = 20 
    } = searchDto;
    
    const skip = (page - 1) * limit;

    const query = this.roomBookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('room.restaurant', 'restaurant');

    if (roomId) {
      query.andWhere('booking.roomId = :roomId', { roomId });
    }

    if (userId) {
      query.andWhere('booking.userId = :userId', { userId });
    }

    if (restaurantId) {
      query.andWhere('room.restaurantId = :restaurantId', { restaurantId });
    }

    if (startDate && endDate) {
      query.andWhere('booking.checkInDate BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    }

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('booking.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findBookingById(id: string): Promise<RoomBooking> {
    const booking = await this.roomBookingRepository.findOne({
      where: { id },
      relations: ['room', 'room.restaurant', 'user', 'payment'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findBookingByNumber(bookingNumber: string): Promise<RoomBooking> {
    const booking = await this.roomBookingRepository.findOne({
      where: { bookingNumber },
      relations: ['room', 'room.restaurant', 'user', 'payment'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with number ${bookingNumber} not found`);
    }

    return booking;
  }

  async updateBooking(id: string, updateBookingDto: UpdateRoomBookingDto): Promise<RoomBooking> {
    const booking = await this.findBookingById(id);

    // Prevent updates for completed or cancelled bookings
    if ([RoomBookingStatus.COMPLETED, RoomBookingStatus.CANCELLED].includes(booking.status)) {
      throw new BadRequestException('Cannot update completed or cancelled booking');
    }

    // If dates are being updated, check availability
    if ((updateBookingDto.checkInDate || updateBookingDto.checkOutDate) && 
        booking.status !== RoomBookingStatus.CHECKED_IN) {
      const checkInDate = updateBookingDto.checkInDate ? new Date(updateBookingDto.checkInDate) : booking.checkInDate;
      const checkOutDate = updateBookingDto.checkOutDate ? new Date(updateBookingDto.checkOutDate) : booking.checkOutDate;

      const isAvailable = await this.isRoomAvailable(
        booking.roomId,
        checkInDate.toISOString(),
        checkOutDate.toISOString(),
        booking.id // exclude current booking
      );

      if (!isAvailable) {
        throw new ConflictException('Room is not available for the selected dates');
      }
    }

    Object.assign(booking, updateBookingDto);
    return await this.roomBookingRepository.save(booking);
  }

  async updateBookingStatus(id: string, statusDto: BookingStatusDto): Promise<RoomBooking> {
    const booking = await this.findBookingById(id);

    // Validate status transitions
    this.validateStatusTransition(booking.status, statusDto.status);

    booking.status = statusDto.status;
    return await this.roomBookingRepository.save(booking);
  }

  async cancelBooking(id: string, performedBy?: string): Promise<RoomBooking> {
    const booking = await this.findBookingById(id);

    // Only allow cancellation for pending or confirmed bookings
    if (![RoomBookingStatus.PENDING, RoomBookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Cannot cancel booking in current status');
    }

    booking.status = RoomBookingStatus.CANCELLED;
    return await this.roomBookingRepository.save(booking);
  }

  // Availability and Search operations
  async checkAvailability(availabilityDto: AvailabilityCheckDto): Promise<{ available: boolean, room?: Room, message?: string }> {
    const room = await this.findRoomById(availabilityDto.roomId);

    // Check capacity
    if (availabilityDto.guests > room.capacity) {
      return { 
        available: false, 
        message: 'Number of guests exceeds room capacity' 
      };
    }

    // Check availability for dates
    const isAvailable = await this.isRoomAvailable(
      availabilityDto.roomId,
      availabilityDto.checkInDate,
      availabilityDto.checkOutDate
    );

    if (!isAvailable) {
      return { 
        available: false, 
        message: 'Room is not available for the selected dates' 
      };
    }

    return { available: true, room: this.parseRoomData(room) };
  }

  async searchAvailableRooms(searchDto: RoomSearchDto): Promise<Room[]> {
    const { restaurantId, checkInDate, checkOutDate, guests, minCapacity, maxPrice } = searchDto;

    if (!checkInDate || !checkOutDate) {
      throw new BadRequestException('Check-in and check-out dates are required');
    }

    // Get all rooms for the restaurant
    const rooms = await this.roomRepository.find({
      where: { 
        restaurantId,
        available: true,
        ...(minCapacity && { capacity: MoreThanOrEqual(minCapacity) }),
        ...(maxPrice && { pricePerNight: LessThanOrEqual(maxPrice) })
      },
      relations: ['restaurant']
    });

    // Filter available rooms
    const availableRooms = await this.filterAvailableRooms(rooms, checkInDate, checkOutDate, guests);

    return availableRooms.map(room => this.parseRoomData(room));
  }

  // Analytics and Reporting
  async getRoomOccupancy(roomId: string, startDate: string, endDate: string): Promise<{ occupiedDays: number, totalDays: number, occupancyRate: number }> {
    const bookings = await this.roomBookingRepository.find({
      where: {
        roomId,
        status: In([RoomBookingStatus.CONFIRMED, RoomBookingStatus.CHECKED_IN, RoomBookingStatus.COMPLETED]),
        checkInDate: LessThanOrEqual(new Date(endDate)),
        checkOutDate: MoreThanOrEqual(new Date(startDate))
      }
    });

    const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    let occupiedDays = 0;

    bookings.forEach(booking => {
      const overlapStart = new Date(Math.max(new Date(startDate).getTime(), booking.checkInDate.getTime()));
      const overlapEnd = new Date(Math.min(new Date(endDate).getTime(), booking.checkOutDate.getTime()));
      const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
      occupiedDays += Math.max(0, overlapDays);
    });

    const occupancyRate = totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0;

    return {
      occupiedDays,
      totalDays,
      occupancyRate: Math.round(occupancyRate * 100) / 100
    };
  }

  async getUpcomingCheckIns(restaurantId: string, days: number = 7): Promise<RoomBooking[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.roomBookingRepository.find({
      where: {
        room: { restaurantId },
        status: RoomBookingStatus.CONFIRMED,
        checkInDate: Between(startDate, endDate)
      },
      relations: ['room', 'user'],
      order: { checkInDate: 'ASC' }
    });
  }

  async getUpcomingCheckOuts(restaurantId: string, days: number = 7): Promise<RoomBooking[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.roomBookingRepository.find({
      where: {
        room: { restaurantId },
        status: RoomBookingStatus.CHECKED_IN,
        checkOutDate: Between(startDate, endDate)
      },
      relations: ['room', 'user'],
      order: { checkOutDate: 'ASC' }
    });
  }

  // Helper methods
  private async isRoomAvailable(roomId: string, checkInDate: string, checkOutDate: string, excludeBookingId?: string): Promise<boolean> {
    const conflictingBookings = await this.roomBookingRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.status IN (:...statuses)', { 
        statuses: [RoomBookingStatus.CONFIRMED, RoomBookingStatus.CHECKED_IN] 
      })
      .andWhere('(booking.checkInDate < :checkOutDate AND booking.checkOutDate > :checkInDate)')
      .setParameters({
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate)
      });

    if (excludeBookingId) {
      conflictingBookings.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const count = await conflictingBookings.getCount();
    return count === 0;
  }

  private async filterAvailableRooms(rooms: Room[], checkInDate: string, checkOutDate: string, guests?: number): Promise<Room[]> {
    const availableRooms: Room[] = [];

    for (const room of rooms) {
      // Check capacity
      if (guests && room.capacity < guests) {
        continue;
      }

      // Check availability for dates
      const isAvailable = await this.isRoomAvailable(room.id, checkInDate, checkOutDate);
      if (isAvailable) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  }

  private generateBookingNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RB${timestamp}${random}`;
  }

  private validateStatusTransition(currentStatus: RoomBookingStatus, newStatus: RoomBookingStatus): void {
    const validTransitions: Record<RoomBookingStatus, RoomBookingStatus[]> = {
      [RoomBookingStatus.PENDING]: [RoomBookingStatus.CONFIRMED, RoomBookingStatus.CANCELLED],
      [RoomBookingStatus.CONFIRMED]: [RoomBookingStatus.CHECKED_IN, RoomBookingStatus.CANCELLED],
      [RoomBookingStatus.CHECKED_IN]: [RoomBookingStatus.CHECKED_OUT, RoomBookingStatus.COMPLETED],
      [RoomBookingStatus.CHECKED_OUT]: [RoomBookingStatus.COMPLETED],
      [RoomBookingStatus.COMPLETED]: [],
      [RoomBookingStatus.CANCELLED]: []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private parseRoomData(room: Room): Room {
    // Create a new object with the same properties
    const parsedRoom: Room = {
      ...room,
      // These will be overridden with proper types
    } as Room;

    // Handle amenities - parse from JSON string to array
    if (room.amenities && typeof room.amenities === 'string') {
      try {
        (parsedRoom as any).amenities = JSON.parse(room.amenities);
      } catch (error) {
        (parsedRoom as any).amenities = [];
      }
    } else if (!room.amenities) {
      (parsedRoom as any).amenities = [];
    }

    // Handle imageGallery - parse from JSON string to array
    if (room.imageGallery && typeof room.imageGallery === 'string') {
      try {
        (parsedRoom as any).imageGallery = JSON.parse(room.imageGallery);
      } catch (error) {
        (parsedRoom as any).imageGallery = [];
      }
    } else if (!room.imageGallery) {
      (parsedRoom as any).imageGallery = [];
    }

    return parsedRoom;
  }
}