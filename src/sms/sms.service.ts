import { Injectable } from '@nestjs/common';
import { Notification } from '../notification/entities/notification.entity';

@Injectable()
export class SmsService {
  async sendNotificationSms(phone: string, notification: Notification) {
    // Implement SMS sending logic
    console.log(`Sending SMS to ${phone}: ${notification.message}`);
  }
}