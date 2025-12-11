import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomBookingDto } from './dto/create-room-booking.dto';
import { UpdateRoomBookingDto } from './dto/update-room-booking.dto';
import { RoomSearchDto } from './dto/room-search.dto';
import { BookingSearchDto } from './dto/booking-search.dto';
import { BookingStatusDto } from './dto/booking-status.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRoleEnum } from '../user/entities/user.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) { }

  // Room endpoints
  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateRoomDto })
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all rooms with filtering' })
  @ApiResponse({ status: 200, description: 'Rooms retrieved successfully' })
  @ApiQuery({ type: RoomSearchDto })
  findAllRooms(@Query() searchDto: RoomSearchDto) {
    return this.roomService.findAllRooms(searchDto);
  }

  @Public()
  @Get('available')
  @ApiOperation({ summary: 'Search available rooms' })
  @ApiResponse({ status: 200, description: 'Available rooms retrieved successfully' })
  @ApiQuery({ type: RoomSearchDto })
  searchAvailableRooms(@Query() searchDto: RoomSearchDto) {
    return this.roomService.searchAvailableRooms(searchDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({ status: 200, description: 'Room retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  findRoomById(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.findRoomById(id);
  }

  @Patch(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update room by ID' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiParam({ name: 'id', description: 'Room ID', type: String })
  @ApiBody({ type: UpdateRoomDto })
  updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto
  ) {
    return this.roomService.updateRoom(id, updateRoomDto);
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete room by ID' })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  removeRoom(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.removeRoom(id);
  }

  // Room Booking endpoints
  @Post('bookings')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Create a new room booking' })
  @ApiResponse({ status: 201, description: 'Room booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or room not available' })
  @ApiBody({ type: CreateRoomBookingDto })
  createRoomBooking(@Body() createBookingDto: CreateRoomBookingDto) {
    return this.roomService.createRoomBooking(createBookingDto);
  }

  @Get('bookings')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Get all room bookings with filtering' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  @ApiQuery({ type: BookingSearchDto })
  findAllBookings(@Query() searchDto: BookingSearchDto) {
    return this.roomService.findAllBookings(searchDto);
  }

  @Get('bookings/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: Number })
  findBookingById(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.findBookingById(id);
  }

  @Get('bookings/number/:bookingNumber')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Get booking by booking number' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiParam({ name: 'bookingNumber', description: 'Booking number', type: String })
  findBookingByNumber(@Param('bookingNumber') bookingNumber: string) {
    return this.roomService.findBookingByNumber(bookingNumber);
  }

  @Patch('bookings/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Update booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: String })
  @ApiBody({ type: UpdateRoomBookingDto })
  updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateRoomBookingDto
  ) {
    return this.roomService.updateBooking(id, updateBookingDto);
  }

  @Patch('bookings/:id/status')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: String })
  @ApiBody({ type: BookingStatusDto })
  updateBookingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: BookingStatusDto
  ) {
    return this.roomService.updateBookingStatus(id, statusDto);
  }

  @Post('bookings/:id/cancel')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        performedBy: {
          type: 'string',
          description: 'User who performed the cancellation',
          example: 'customer@example.com'
        }
      },
      required: []
    }
  })
  cancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body('performedBy') performedBy?: string
  ) {
    return this.roomService.cancelBooking(id, performedBy);
  }

  // Availability endpoints
  @Post('check-availability')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Check room availability' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: AvailabilityCheckDto })
  checkAvailability(@Body() availabilityDto: AvailabilityCheckDto) {
    return this.roomService.checkAvailability(availabilityDto);
  }

  // Analytics endpoints
  @Get(':id/occupancy')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get room occupancy statistics' })
  @ApiResponse({ status: 200, description: 'Occupancy statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiParam({ name: 'id', description: 'Room ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  getRoomOccupancy(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.roomService.getRoomOccupancy(id, startDate, endDate);
  }

  @Get('restaurant/:restaurantId/upcoming-checkins')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get upcoming check-ins for restaurant' })
  @ApiResponse({ status: 200, description: 'Upcoming check-ins retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'days', description: 'Days to look ahead', required: false, type: Number })
  getUpcomingCheckIns(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.roomService.getUpcomingCheckIns(restaurantId, days);
  }

  @Get('restaurant/:restaurantId/upcoming-checkouts')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get upcoming check-outs for restaurant' })
  @ApiResponse({ status: 200, description: 'Upcoming check-outs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'days', description: 'Days to look ahead', required: false, type: Number })
  getUpcomingCheckOuts(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.roomService.getUpcomingCheckOuts(restaurantId, days);
  }
}