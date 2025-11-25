import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { Otp } from './entities/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}