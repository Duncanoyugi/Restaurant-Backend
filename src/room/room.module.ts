import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { RoomBooking } from './entities/room-booking.entity';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { RoomSeeder } from './room.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      RoomBooking
    ]),
    UserModule,
    forwardRef(() => PaymentModule),
    RestaurantModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomSeeder],
  exports: [RoomService, TypeOrmModule],
})
export class RoomModule { }
