import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const validateEnvironment = (config: Record<string, string | undefined>) => {
  const commonRequired = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
  const productionRequired = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'PAYSTACK_SECRET_KEY',
    'FRONTEND_URL',
  ];

  const requiredKeys = process.env.NODE_ENV === 'production'
    ? [...commonRequired, ...productionRequired]
    : commonRequired;

  const missing = requiredKeys.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
};

import { DatabaseModule } from './database/database.module';
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
import { OtpModule } from './otp/otp.module';
import { SmsModule } from './sms/sms.module';
import { PushNotificationModule } from './push-notification/push-notification.module';

@Module({
  imports: [
    // ✅ Render injects env vars – no .env file in production
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    // ✅ SINGLE database entry point
    DatabaseModule,

    MenuModule,
    OrderModule,
    LocationModule,
    ReservationModule,
    RoomModule,
    PaymentModule,
    ReviewModule,
    NotificationModule,
    UserModule,
    InventoryModule,
    AuthModule,
    MailerModule,
    AnalyticsModule,
    DeliveryModule,
    RestaurantModule,
    OtpModule,
    SmsModule,
    PushNotificationModule,
  ],
})
export class AppModule { }
