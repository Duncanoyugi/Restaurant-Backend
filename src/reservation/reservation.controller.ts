// backend\src\reservation\reservation.controller.ts
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
  ClassSerializerInterceptor,
  UseGuards,
  Request,
  ForbiddenException
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
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { ReservationSearchDto } from './dto/reservation-search.dto';
import { TableSearchDto } from './dto/table-search.dto';
import { ReservationStatusDto } from './dto/reservation-status.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { TableAvailabilityDto } from './dto/table-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('reservations')
@ApiBearerAuth('JWT-auth')
@Controller('reservations')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // Table endpoints - Restaurant Owner and Admin only
  @Post('tables')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new restaurant table (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiBody({ type: CreateTableDto })
  createTable(@Body() createTableDto: CreateTableDto, @Request() req) {
    return this.reservationService.createTable(createTableDto, req.user);
  }

  @Get('tables')
  @ApiOperation({ summary: 'Get all tables with filtering' })
  @ApiResponse({ status: 200, description: 'Tables retrieved successfully' })
  @ApiQuery({ type: TableSearchDto })
  findAllTables(@Query() searchDto: TableSearchDto) {
    return this.reservationService.findAllTables(searchDto);
  }

  @Get('tables/:id')
  @ApiOperation({ summary: 'Get table by ID' })
  @ApiResponse({ status: 200, description: 'Table retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID', type: String })
  findTableById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.findTableById(id);
  }

  @Patch('tables/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update table by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Table updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID', type: String })
  @ApiBody({ type: UpdateTableDto })
  updateTable(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateTableDto: UpdateTableDto,
    @Request() req
  ) {
    return this.reservationService.updateTable(id, updateTableDto, req.user);
  }

  @Delete('tables/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete table by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Table deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID', type: String })
  removeTable(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.reservationService.removeTable(id, req.user);
  }

  // Reservation endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or table not available' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot create reservation for other users' })
  @ApiBody({ type: CreateReservationDto })
  createReservation(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    // Customers can only create reservations for themselves
    if (createReservationDto.userId && createReservationDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create reservations for yourself');
    }
    
    // Auto-assign user ID if not provided
    const reservationData = {
      ...createReservationDto,
      userId: createReservationDto.userId || req.user.id
    };
    
    return this.reservationService.createReservation(reservationData, req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get all reservations with filtering (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiQuery({ type: ReservationSearchDto })
  findAllReservations(@Query() searchDto: ReservationSearchDto, @Request() req) {
    return this.reservationService.findAllReservations(searchDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  findReservationById(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.reservationService.findReservationById(id, req.user);
  }

  @Get('number/:reservationNumber')
  @ApiOperation({ summary: 'Get reservation by reservation number' })
  @ApiResponse({ status: 200, description: 'Reservation retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'reservationNumber', description: 'Reservation number', type: String })
  findReservationByNumber(@Param('reservationNumber') reservationNumber: string, @Request() req) {
    return this.reservationService.findReservationByNumber(reservationNumber, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update this reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  @ApiBody({ type: UpdateReservationDto })
  updateReservation(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateReservationDto: UpdateReservationDto,
    @Request() req
  ) {
    return this.reservationService.updateReservation(id, updateReservationDto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Update reservation status (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Reservation status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  @ApiBody({ type: ReservationStatusDto })
  updateReservationStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: ReservationStatusDto,
    @Request() req
  ) {
    return this.reservationService.updateReservationStatus(id, statusDto, req.user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot cancel this reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
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
  cancelReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body('performedBy') performedBy?: string
  ) {
    return this.reservationService.cancelReservation(id, performedBy, req.user);
  }

  // Availability endpoints - Public access
  @Post('check-availability')
  @ApiOperation({ summary: 'Check table availability' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: AvailabilityCheckDto })
  checkAvailability(@Body() availabilityDto: AvailabilityCheckDto) {
    return this.reservationService.checkAvailability(availabilityDto);
  }

  @Post('available-tables')
  @ApiOperation({ summary: 'Find available tables for given criteria' })
  @ApiResponse({ status: 200, description: 'Available tables retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: TableAvailabilityDto })
  findAvailableTables(@Body() availabilityDto: TableAvailabilityDto) {
    return this.reservationService.findAvailableTables(availabilityDto);
  }

  // Analytics endpoints - Restaurant and Admin only
  @Get('restaurant/:restaurantId/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get reservation statistics for restaurant (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Reservation statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  getReservationStats(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.reservationService.getReservationStats(restaurantId, startDate, endDate, req.user);
  }

  @Get('restaurant/:restaurantId/upcoming')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get upcoming reservations for restaurant (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Upcoming reservations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'hours', description: 'Hours to look ahead', required: false, type: Number })
  getUpcomingReservations(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number,
    @Request() req
  ) {
    return this.reservationService.getUpcomingReservations(restaurantId, hours, req.user);
  }

  @Get('restaurant/:restaurantId/daily')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get daily reservations for restaurant (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Daily reservations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', required: true })
  getDailyReservations(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('date') date: string,
    @Request() req
  ) {
    return this.reservationService.getDailyReservations(restaurantId, date, req.user);
  }

  // User-specific endpoints
  @Get('user/my-reservations')
  @ApiOperation({ summary: 'Get current user reservations' })
  @ApiResponse({ status: 200, description: 'User reservations retrieved successfully' })
  getMyReservations(@Request() req) {
    const searchDto: ReservationSearchDto = { userId: req.user.id };
    return this.reservationService.findAllReservations(searchDto, req.user);
  }

  @Get('restaurant/my-reservations')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get current restaurant reservations (Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Restaurant reservations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner or Staff access required' })
  getMyRestaurantReservations(@Request() req) {
    return this.reservationService.getMyRestaurantReservations(req.user);
  }

  @Get('restaurant/my-tables')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get current restaurant tables (Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Restaurant tables retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner or Staff access required' })
  getMyRestaurantTables(@Request() req) {
    return this.reservationService.getMyRestaurantTables(req.user);
  }
}