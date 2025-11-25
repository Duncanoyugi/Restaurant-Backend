import { Injectable } from '@nestjs/common';
import { Notification } from '../notification/entities/notification.entity';

@Injectable()
export class PushNotificationService {
  async sendPushNotification(pushToken: string, notification: Notification) {
    // Implement push notification logic (FCM, APNS, etc.)
    console.log(`Sending push to ${pushToken}: ${notification.title}`);
  }
}