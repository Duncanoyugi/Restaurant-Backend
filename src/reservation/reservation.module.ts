import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { Table } from './entities/table.entity';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Table
    ]),
    RestaurantModule, // This provides RestaurantRepository
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService, TypeOrmModule],
})
export class ReservationModule {}