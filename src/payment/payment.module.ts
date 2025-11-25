// backend/src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { Invoice } from './entities/invoice.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { RoomBooking } from '../room/entities/room-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment, 
      Invoice, 
      User, 
      Order, 
      Reservation, 
      RoomBooking
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}