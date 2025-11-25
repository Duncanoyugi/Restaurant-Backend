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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
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

@ApiTags('reservations')
@Controller('reservations')
@UseInterceptors(ClassSerializerInterceptor)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // Table endpoints
  @Post('tables')
  @ApiOperation({ summary: 'Create a new restaurant table' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateTableDto })
  createTable(@Body() createTableDto: CreateTableDto) {
    return this.reservationService.createTable(createTableDto);
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
  @ApiOperation({ summary: 'Update table by ID' })
  @ApiResponse({ status: 200, description: 'Table updated successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID', type: String })
  @ApiBody({ type: UpdateTableDto })
  updateTable(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateTableDto: UpdateTableDto
  ) {
    return this.reservationService.updateTable(id, updateTableDto);
  }

  @Delete('tables/:id')
  @ApiOperation({ summary: 'Delete table by ID' })
  @ApiResponse({ status: 200, description: 'Table deleted successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID', type: String })
  removeTable(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.removeTable(id);
  }

  // Reservation endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or table not available' })
  @ApiBody({ type: CreateReservationDto })
  createReservation(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.createReservation(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations with filtering' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved successfully' })
  @ApiQuery({ type: ReservationSearchDto })
  findAllReservations(@Query() searchDto: ReservationSearchDto) {
    return this.reservationService.findAllReservations(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  findReservationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.findReservationById(id);
  }

  @Get('number/:reservationNumber')
  @ApiOperation({ summary: 'Get reservation by reservation number' })
  @ApiResponse({ status: 200, description: 'Reservation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'reservationNumber', description: 'Reservation number', type: String })
  findReservationByNumber(@Param('reservationNumber') reservationNumber: string) {
    return this.reservationService.findReservationByNumber(reservationNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  @ApiBody({ type: UpdateReservationDto })
  updateReservation(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateReservationDto: UpdateReservationDto
  ) {
    return this.reservationService.updateReservation(id, updateReservationDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update reservation status' })
  @ApiResponse({ status: 200, description: 'Reservation status updated successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  @ApiBody({ type: ReservationStatusDto })
  updateReservationStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: ReservationStatusDto
  ) {
    return this.reservationService.updateReservationStatus(id, statusDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
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
    @Body('performedBy') performedBy?: string
  ) {
    return this.reservationService.cancelReservation(id, performedBy);
  }

  // Availability endpoints
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

  // Analytics endpoints
  @Get('restaurant/:restaurantId/stats')
  @ApiOperation({ summary: 'Get reservation statistics for restaurant' })
  @ApiResponse({ status: 200, description: 'Reservation statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  getReservationStats(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reservationService.getReservationStats(restaurantId, startDate, endDate);
  }

  @Get('restaurant/:restaurantId/upcoming')
  @ApiOperation({ summary: 'Get upcoming reservations for restaurant' })
  @ApiResponse({ status: 200, description: 'Upcoming reservations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'hours', description: 'Hours to look ahead', required: false, type: Number })
  getUpcomingReservations(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number
  ) {
    return this.reservationService.getUpcomingReservations(restaurantId, hours);
  }

  @Get('restaurant/:restaurantId/daily')
  @ApiOperation({ summary: 'Get daily reservations for restaurant' })
  @ApiResponse({ status: 200, description: 'Daily reservations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', required: true })
  getDailyReservations(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('date') date: string
  ) {
    return this.reservationService.getDailyReservations(restaurantId, date);
  }
}