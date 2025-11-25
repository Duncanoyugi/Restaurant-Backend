import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomBookingDto } from './dto/create-room-booking.dto';
import { UpdateRoomBookingDto } from './dto/update-room-booking.dto';
import { RoomSearchDto } from './dto/room-search.dto';
import { BookingSearchDto } from './dto/booking-search.dto';
import { BookingStatusDto } from './dto/booking-status.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';

@Controller('rooms')
@UseInterceptors(ClassSerializerInterceptor)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // Room endpoints
  @Post()
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto);
  }

  @Get()
  findAllRooms(@Query() searchDto: RoomSearchDto) {
    return this.roomService.findAllRooms(searchDto);
  }

  @Get('available')
  searchAvailableRooms(@Query() searchDto: RoomSearchDto) {
    return this.roomService.searchAvailableRooms(searchDto);
  }

  @Get(':id')
  findRoomById(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findRoomById(id);
  }

  @Patch(':id')
  updateRoom(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateRoomDto: UpdateRoomDto
  ) {
    return this.roomService.updateRoom(id, updateRoomDto);
  }

  @Delete(':id')
  removeRoom(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.removeRoom(id);
  }

  // Room Booking endpoints
  @Post('bookings')
  createRoomBooking(@Body() createBookingDto: CreateRoomBookingDto) {
    return this.roomService.createRoomBooking(createBookingDto);
  }

  @Get('bookings')
  findAllBookings(@Query() searchDto: BookingSearchDto) {
    return this.roomService.findAllBookings(searchDto);
  }

  @Get('bookings/:id')
  findBookingById(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findBookingById(id);
  }

  @Get('bookings/number/:bookingNumber')
  findBookingByNumber(@Param('bookingNumber') bookingNumber: string) {
    return this.roomService.findBookingByNumber(bookingNumber);
  }

  @Patch('bookings/:id')
  updateBooking(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateBookingDto: UpdateRoomBookingDto
  ) {
    return this.roomService.updateBooking(id, updateBookingDto);
  }

  @Patch('bookings/:id/status')
  updateBookingStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: BookingStatusDto
  ) {
    return this.roomService.updateBookingStatus(id, statusDto);
  }

  @Post('bookings/:id/cancel')
  cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('performedBy') performedBy?: string
  ) {
    return this.roomService.cancelBooking(id, performedBy);
  }

  // Availability endpoints
  @Post('check-availability')
  checkAvailability(@Body() availabilityDto: AvailabilityCheckDto) {
    return this.roomService.checkAvailability(availabilityDto);
  }

  // Analytics endpoints
  @Get(':id/occupancy')
  getRoomOccupancy(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.roomService.getRoomOccupancy(id, startDate, endDate);
  }

  @Get('restaurant/:restaurantId/upcoming-checkins')
  getUpcomingCheckIns(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.roomService.getUpcomingCheckIns(restaurantId, days);
  }

  @Get('restaurant/:restaurantId/upcoming-checkouts')
  getUpcomingCheckOuts(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.roomService.getUpcomingCheckOuts(restaurantId, days);
  }
}