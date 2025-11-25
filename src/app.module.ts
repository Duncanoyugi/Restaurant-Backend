import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { LocationModule } from './location/location.module';
import { ReservationModule } from './reservation/reservation.module';
import { RoomModule } from './room/room.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewModule } from './review/review.module';
import { NotificationModule } from './notification/notification.module';
import { UserModule } from './user/user.module';
import { InventoryModule } from './inventory/inventory.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DeliveryModule } from './delivery/delivery.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database/database.config';
import { OtpModule } from './otp/otp.module';
import { SmsModule } from './sms/sms.module';
import { PushNotificationModule } from './push-notification/push-notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    MenuModule, OrderModule, LocationModule, ReservationModule, RoomModule, PaymentModule, ReviewModule, NotificationModule, UserModule, InventoryModule, AuthModule, MailerModule, AnalyticsModule, DeliveryModule, RestaurantModule, DatabaseModule, OtpModule, SmsModule, PushNotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
