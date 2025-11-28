import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // ADD THIS IMPORT
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryTracking } from './entities/delivery-tracking.entity';
import { VehicleInfo } from './entities/vehicle-info.entity';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryTracking,
      VehicleInfo,
    ]),
    OrderModule, // Provides OrderRepository
    UserModule, // Provides UserRepository
    RestaurantModule, // Provides RestaurantRepository
    ConfigModule, // ADD THIS - Provides ConfigService
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}