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

@Controller('reservations')
@UseInterceptors(ClassSerializerInterceptor)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // Table endpoints
  @Post('tables')
  createTable(@Body() createTableDto: CreateTableDto) {
    return this.reservationService.createTable(createTableDto);
  }

  @Get('tables')
  findAllTables(@Query() searchDto: TableSearchDto) {
    return this.reservationService.findAllTables(searchDto);
  }

  @Get('tables/:id')
  findTableById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.findTableById(id);
  }

  @Patch('tables/:id')
  updateTable(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateTableDto: UpdateTableDto
  ) {
    return this.reservationService.updateTable(id, updateTableDto);
  }

  @Delete('tables/:id')
  removeTable(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.removeTable(id);
  }

  // Reservation endpoints
  @Post()
  createReservation(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.createReservation(createReservationDto);
  }

  @Get()
  findAllReservations(@Query() searchDto: ReservationSearchDto) {
    return this.reservationService.findAllReservations(searchDto);
  }

  @Get(':id')
  findReservationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.findReservationById(id);
  }

  @Get('number/:reservationNumber')
  findReservationByNumber(@Param('reservationNumber') reservationNumber: string) {
    return this.reservationService.findReservationByNumber(reservationNumber);
  }

  @Patch(':id')
  updateReservation(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateReservationDto: UpdateReservationDto
  ) {
    return this.reservationService.updateReservation(id, updateReservationDto);
  }

  @Patch(':id/status')
  updateReservationStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: ReservationStatusDto
  ) {
    return this.reservationService.updateReservationStatus(id, statusDto);
  }

  @Post(':id/cancel')
  cancelReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('performedBy') performedBy?: string
  ) {
    return this.reservationService.cancelReservation(id, performedBy);
  }

  // Availability endpoints
  @Post('check-availability')
  checkAvailability(@Body() availabilityDto: AvailabilityCheckDto) {
    return this.reservationService.checkAvailability(availabilityDto);
  }

  @Post('available-tables')
  findAvailableTables(@Body() availabilityDto: TableAvailabilityDto) {
    return this.reservationService.findAvailableTables(availabilityDto);
  }

  // Analytics endpoints
  @Get('restaurant/:restaurantId/stats')
  getReservationStats(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reservationService.getReservationStats(restaurantId, startDate, endDate);
  }

  @Get('restaurant/:restaurantId/upcoming')
  getUpcomingReservations(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number
  ) {
    return this.reservationService.getUpcomingReservations(restaurantId, hours);
  }

  @Get('restaurant/:restaurantId/daily')
  getDailyReservations(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('date') date: string
  ) {
    return this.reservationService.getDailyReservations(restaurantId, date);
  }
}