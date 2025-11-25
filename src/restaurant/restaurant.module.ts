import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantStaff } from './entities/restaurant-staff.entity';
import { Shift } from './entities/shift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      RestaurantStaff,
      Shift
    ])
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService, TypeOrmModule],
})
export class RestaurantModule {}