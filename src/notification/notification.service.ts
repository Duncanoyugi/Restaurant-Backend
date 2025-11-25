import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Notification, NotificationType, NotificationPriority, NotificationChannel } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    // FIX: Use empty string instead of undefined for metadata
    const notificationData = {
      userId: createNotificationDto.userId,
      type: createNotificationDto.type,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      priority: createNotificationDto.priority,
      channel: createNotificationDto.channel,
      actionUrl: createNotificationDto.actionUrl,
      actionLabel: createNotificationDto.actionLabel,
      metadata: createNotificationDto.metadata ? JSON.stringify(createNotificationDto.metadata) : '',
    };

    const notification = this.notificationRepository.create(notificationData);
    const savedNotification = await this.notificationRepository.save(notification);

    // Send notification through appropriate channel
    await this.sendNotification(savedNotification);

    return this.formatNotification(savedNotification);
  }

  async createBulk(bulkNotificationDto: BulkNotificationDto) {
    // FIX: Use empty string instead of undefined for metadata
    const notificationsData = bulkNotificationDto.userIds.map(userId => ({
      userId,
      type: bulkNotificationDto.type,
      title: bulkNotificationDto.title,
      message: bulkNotificationDto.message,
      priority: bulkNotificationDto.priority,
      channel: bulkNotificationDto.channel,
      actionUrl: bulkNotificationDto.actionUrl,
      actionLabel: bulkNotificationDto.actionLabel,
      metadata: bulkNotificationDto.metadata ? JSON.stringify(bulkNotificationDto.metadata) : '',
    }));

    const notifications = this.notificationRepository.create(notificationsData);
    const savedNotifications = await this.notificationRepository.save(notifications);

    // Send notifications in background
    this.sendBulkNotifications(savedNotifications).catch(error => {
      this.logger.error('Failed to send bulk notifications', error.stack);
    });

    return savedNotifications.map(notification => this.formatNotification(notification));
  }

  async findAll(query: NotificationQueryDto, userId?: string) {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      priority, 
      channel, 
      isRead, 
      startDate, 
      endDate,
      unreadOnly 
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (channel) {
      where.channel = channel;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const formattedNotifications = notifications.map(notification => 
      this.formatNotification(notification)
    );

    return {
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount: await this.getUnreadCount(userId),
    };
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.formatNotification(notification);
  }

  async findByUserId(userId: string, query: NotificationQueryDto) {
    return this.findAll({ ...query, unreadOnly: query.unreadOnly }, userId);
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // FIX: Explicitly update fields with proper typing
    if (updateNotificationDto.type !== undefined) notification.type = updateNotificationDto.type;
    if (updateNotificationDto.title !== undefined) notification.title = updateNotificationDto.title;
    if (updateNotificationDto.message !== undefined) notification.message = updateNotificationDto.message;
    if (updateNotificationDto.priority !== undefined) notification.priority = updateNotificationDto.priority;
    if (updateNotificationDto.channel !== undefined) notification.channel = updateNotificationDto.channel;
    if (updateNotificationDto.actionUrl !== undefined) notification.actionUrl = updateNotificationDto.actionUrl;
    if (updateNotificationDto.actionLabel !== undefined) notification.actionLabel = updateNotificationDto.actionLabel;
    
    // FIX: Use empty string instead of undefined for metadata
    if (updateNotificationDto.metadata !== undefined) {
      notification.metadata = updateNotificationDto.metadata ? JSON.stringify(updateNotificationDto.metadata) : '';
    }

    const updatedNotification = await this.notificationRepository.save(notification);
    return this.formatNotification(updatedNotification);
  }

  async remove(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await this.notificationRepository.remove(notification);
    return { message: 'Notification deleted successfully' };
  }

  async markAsRead(id: string, markReadDto: MarkReadDto) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    notification.isRead = markReadDto.isRead;
    (notification as any).readAt = markReadDto.isRead ? new Date() : null;

    const updatedNotification = await this.notificationRepository.save(notification);
    return this.formatNotification(updatedNotification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId?: string) {
    const where: any = { isRead: false };
    
    if (userId) {
      where.userId = userId;
    }

    return await this.notificationRepository.count({ where });
  }

  async getNotificationStats(userId?: string) {
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }

    const total = await this.notificationRepository.count({ where });
    const unread = await this.notificationRepository.count({ where: { ...where, isRead: false } });
    
    const byType = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(notification.id)', 'count')
      .where(where)
      .groupBy('notification.type')
      .getRawMany();

    const byChannel = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.channel', 'channel')
      .addSelect('COUNT(notification.id)', 'count')
      .where(where)
      .groupBy('notification.channel')
      .getRawMany();

    return {
      total,
      unread,
      byType: byType.reduce((acc, curr) => {
        acc[curr.type] = parseInt(curr.count);
        return acc;
      }, {}),
      byChannel: byChannel.reduce((acc, curr) => {
        acc[curr.channel] = parseInt(curr.count);
        return acc;
      }, {}),
    };
  }

  // System notification methods for different workflows
  async notifyOrderConfirmed(userId: string, orderData: any) {
    return this.create({
      userId,
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Order Confirmed',
      message: `Your order #${orderData.orderNumber} has been confirmed and is being prepared.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { orderId: orderData.id, orderNumber: orderData.orderNumber },
      actionUrl: `/orders/${orderData.id}`,
      actionLabel: 'View Order',
    } as CreateNotificationDto);
  }

  async notifyReservationConfirmed(userId: string, reservationData: any) {
    return this.create({
      userId,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: 'Reservation Confirmed',
      message: `Your reservation for ${reservationData.date} at ${reservationData.time} has been confirmed.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { reservationId: reservationData.id },
      actionUrl: `/reservations/${reservationData.id}`,
      actionLabel: 'View Reservation',
    } as CreateNotificationDto);
  }

  async notifyPaymentSuccess(userId: string, paymentData: any) {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Your payment of ${paymentData.amount} ${paymentData.currency} was successful.`,
      priority: NotificationPriority.HIGH,
      metadata: { paymentId: paymentData.id, amount: paymentData.amount },
      actionUrl: `/payments/${paymentData.id}`,
      actionLabel: 'View Payment',
    } as CreateNotificationDto);
  }

  async notifyDeliveryAssigned(userId: string, deliveryData: any) {
    return this.create({
      userId,
      type: NotificationType.DELIVERY_ASSIGNED,
      title: 'Delivery Partner Assigned',
      message: `Your order is on the way! ${deliveryData.deliveryPartner} will deliver your order.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { deliveryId: deliveryData.id, partner: deliveryData.deliveryPartner },
    } as CreateNotificationDto);
  }

  async notifyLowInventory(adminUserIds: string[], inventoryData: any) {
    return this.createBulk({
      userIds: adminUserIds,
      type: NotificationType.LOW_INVENTORY_ALERT,
      title: 'Low Inventory Alert',
      message: `Inventory for ${inventoryData.itemName} is running low. Current stock: ${inventoryData.currentStock}`,
      priority: NotificationPriority.HIGH,
      metadata: { inventoryId: inventoryData.id, itemName: inventoryData.itemName, currentStock: inventoryData.currentStock },
      actionUrl: `/inventory/${inventoryData.id}`,
      actionLabel: 'Manage Inventory',
    } as BulkNotificationDto);
  }

  async notifyNewReview(reviewData: any) {
    // Notify restaurant owners/admins about new review
    const adminUserIds: string[] = []; // Placeholder - implement as needed
    return this.createBulk({
      userIds: adminUserIds,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'New Review Received',
      message: `A new ${reviewData.rating}-star review has been submitted.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { reviewId: reviewData.id, rating: reviewData.rating },
      actionUrl: `/reviews/${reviewData.id}`,
      actionLabel: 'View Review',
    } as BulkNotificationDto);
  }

  private async sendNotification(notification: Notification) {
    try {
      // Placeholder implementation - implement actual notification sending logic
      this.logger.log(`Sending notification to user ${notification.userId}: ${notification.title}`);

      // Mark as sent
      notification.isSent = true;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}`, error.stack);
    }
  }

  private async sendBulkNotifications(notifications: Notification[]) {
    for (const notification of notifications) {
      await this.sendNotification(notification);
    }
  }

  private formatNotification(notification: Notification) {
    return {
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      user: notification.user ? {
        id: notification.user.id,
        name: notification.user.name,
        email: notification.user.email,
      } : null,
    };
  }

  async cleanupExpiredNotifications() {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at IS NOT NULL AND expires_at < :currentDate', { currentDate: new Date() })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} expired notifications`);
    return result;
  }
}