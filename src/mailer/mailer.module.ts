import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { MailerService } from './mailer.service';
import { EmailLog } from './email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog]),
    ConfigModule,
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}