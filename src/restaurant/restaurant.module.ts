import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantStaff } from './entities/restaurant-staff.entity';
import { Shift } from './entities/shift.entity';
import { RestaurantSeeder } from './restaurant.seed';
import { City } from '../location/entities/city.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      RestaurantStaff,
      Shift,
      City,
      User,
    ])
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService, RestaurantSeeder],
  exports: [RestaurantService, TypeOrmModule], // Make sure TypeOrmModule is exported
})
export class RestaurantModule { }