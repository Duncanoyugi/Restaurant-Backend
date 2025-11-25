import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { RoomBooking } from './entities/room-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      RoomBooking
    ])
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService, TypeOrmModule],
})
export class RoomModule {}