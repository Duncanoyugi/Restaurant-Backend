// backend\src\notification\notification.service.ts
import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, FindOptionsWhere } from 'typeorm';
import { Notification, NotificationType, NotificationPriority, NotificationChannel } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { User } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/entities/user.types';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  // Helper method to check notification access
  private async checkNotificationAccess(user: User, notificationId?: string, notificationUserId?: string): Promise<void> {
    if (user.role.name === UserRoleEnum.ADMIN) {
      return; // Admin has access to all notifications
    }

    // Users can only access their own notifications
    if (notificationUserId && user.id !== notificationUserId) {
      throw new ForbiddenException('You can only access your own notifications');
    }

    // Check specific notification access
    if (notificationId) {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId },
        relations: ['user']
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${notificationId} not found`);
      }

      if (user.id !== notification.userId && user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('You can only access your own notifications');
      }
    }
  }

  // Helper method to check restaurant access for notifications
  private async checkRestaurantNotificationAccess(user: User, restaurantId?: string): Promise<void> {
    if (user.role.name === UserRoleEnum.ADMIN) {
      return;
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      if (!restaurantId) {
        throw new BadRequestException('Restaurant ID is required for restaurant notifications');
      }

      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
        relations: ['owner', 'staff', 'staff.user']
      });

      if (!restaurant) {
        throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
      }

      // Check if user is owner
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER && restaurant.owner.id !== user.id) {
        throw new ForbiddenException('You can only manage notifications for your own restaurant');
      }

      // Check if user is staff member
      if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
        const isStaff = restaurant.staff.some(staff => staff.user.id === user.id);
        if (!isStaff) {
          throw new ForbiddenException('You can only access notifications for the restaurant you work at');
        }
      }
    }
  }

  async create(createNotificationDto: CreateNotificationDto, user?: User): Promise<any> {
    // Check permissions for creating notifications
    if (user) {
      // Restaurant owners can only create notifications for their restaurant context
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
        if (createNotificationDto.metadata?.restaurantId) {
          await this.checkRestaurantNotificationAccess(user, createNotificationDto.metadata.restaurantId);
        } else {
          throw new BadRequestException('Restaurant ID is required in metadata for restaurant owners');
        }
      }
      
      // Only admin can create notifications for other users
      if (createNotificationDto.userId && user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('You can only create notifications for yourself');
      }
    }

    // FIX: Proper typing for notification data with required userId
    const notificationData: Partial<Notification> = {
      userId: createNotificationDto.userId || (user ? user.id : createNotificationDto.userId),
      type: createNotificationDto.type,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      priority: createNotificationDto.priority,
      channel: createNotificationDto.channel,
      actionUrl: createNotificationDto.actionUrl,
      actionLabel: createNotificationDto.actionLabel,
      metadata: createNotificationDto.metadata ? JSON.stringify(createNotificationDto.metadata) : '',
    };

    // Ensure userId is provided
    if (!notificationData.userId) {
      throw new BadRequestException('User ID is required for notification');
    }

    const notification = this.notificationRepository.create(notificationData);
    const savedNotification = await this.notificationRepository.save(notification);

    // Send notification through appropriate channel
    await this.sendNotification(savedNotification);

    return this.formatNotification(savedNotification);
  }

  async createBulk(bulkNotificationDto: BulkNotificationDto, user?: User): Promise<any[]> {
    // Check permissions for bulk notifications
    if (user && user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can send bulk notifications to multiple users');
    }

    // FIX: Proper typing for bulk notification data
    const notificationsData: Partial<Notification>[] = bulkNotificationDto.userIds.map(userId => ({
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

  async findAll(query: NotificationQueryDto, user?: User): Promise<any> {
    // Only admin can access all notifications
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can access all notifications');
    }

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

    const where: FindOptionsWhere<Notification> = {};

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
      unreadCount: await this.getUnreadCount(undefined, user),
    };
  }

  async findOne(id: string, user?: User): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Check access permissions
    if (!user) {
      throw new ForbiddenException('User context is required to access notifications');
    }
    await this.checkNotificationAccess(user, id, notification.userId);

    return this.formatNotification(notification);
  }

  async findByUserId(userId: string, query: NotificationQueryDto, user?: User): Promise<any> {
    // Users can only access their own notifications
    if (user && user.id !== userId && user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('You can only access your own notifications');
    }

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

    const where: FindOptionsWhere<Notification> = { userId };

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
      unreadCount: await this.getUnreadCount(userId, user),
    };
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto, user?: User): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Check access permissions
    if (!user) {
      throw new ForbiddenException('User context is required to update notifications');
    }
    await this.checkNotificationAccess(user, id, notification.userId);

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

  async remove(id: string, user?: User): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Check access permissions - users can only delete their own notifications
    if (!user) {
      throw new ForbiddenException('User context is required to delete notifications');
    }
    await this.checkNotificationAccess(user, id, notification.userId);

    await this.notificationRepository.remove(notification);
    return { message: 'Notification deleted successfully' };
  }

  async markAsRead(id: string, markReadDto: MarkReadDto, user?: User): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Check access permissions
    if (!user) {
      throw new ForbiddenException('User context is required to mark notifications as read');
    }
    await this.checkNotificationAccess(user, id, notification.userId);
    
    notification.isRead = markReadDto.isRead;
    
    // FIX: Handle readAt field properly - use null instead of undefined
    if (markReadDto.isRead) {
      notification.readAt = new Date();
    } else {
      notification.readAt = null as any;
    }

    const updatedNotification = await this.notificationRepository.save(notification);
    return this.formatNotification(updatedNotification);
  }

  async markAllAsRead(userId: string, user?: User): Promise<any> {
    // Users can only mark their own notifications as read
    if (user && user.id !== userId && user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId?: string, user?: User): Promise<number> {
    const where: FindOptionsWhere<Notification> = { isRead: false };
    
    if (userId) {
      // Users can only get count for their own notifications
      if (user && user.id !== userId && user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('You can only get unread count for your own notifications');
      }
      where.userId = userId;
    }

    return await this.notificationRepository.count({ where });
  }

  async getNotificationStats(userId?: string, user?: User): Promise<any> {
    const where: FindOptionsWhere<Notification> = {};
    
    if (userId) {
      // Users can only get stats for their own notifications
      if (user && user.id !== userId && user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('You can only get statistics for your own notifications');
      }
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
      }, {} as Record<string, number>),
      byChannel: byChannel.reduce((acc, curr) => {
        acc[curr.channel] = parseInt(curr.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Restaurant-specific notification methods
  async findRestaurantNotifications(query: NotificationQueryDto, user: User): Promise<any> {
    if (!user.role.name.includes('RESTAURANT')) {
      throw new ForbiddenException('Only restaurant users can access restaurant notifications');
    }

    // Get user's restaurant ID
    let restaurantId: string | undefined;
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { owner: { id: user.id } }
      });
      restaurantId = restaurant?.id;
    } else if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const staffRecord = await this.restaurantRepository
        .createQueryBuilder('restaurant')
        .innerJoin('restaurant.staff', 'staff')
        .where('staff.userId = :userId', { userId: user.id })
        .getOne();
      restaurantId = staffRecord?.id;
    }

    if (!restaurantId) {
      throw new NotFoundException('Restaurant not found for user');
    }

    // Find notifications related to this restaurant
    const notifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.metadata LIKE :restaurantId', { restaurantId: `%"restaurantId":"${restaurantId}"%` })
      .orWhere('notification.type IN (:...restaurantTypes)', {
        restaurantTypes: [
          NotificationType.LOW_INVENTORY_ALERT,
          NotificationType.REVIEW_RECEIVED,
          NotificationType.NEW_ORDER_RECEIVED,
          NotificationType.NEW_RESERVATION_RECEIVED
        ]
      })
      .orderBy('notification.createdAt', 'DESC')
      .getMany();

    return {
      notifications: notifications.map(notification => this.formatNotification(notification)),
      total: notifications.length
    };
  }

  async broadcastToRestaurantCustomers(createNotificationDto: CreateNotificationDto, user: User): Promise<any> {
    if (user.role.name !== UserRoleEnum.RESTAURANT_OWNER) {
      throw new ForbiddenException('Only restaurant owners can broadcast to customers');
    }

    // Get restaurant customers (simplified - in real app, get from orders/reservations)
    const customerIds = await this.getRestaurantCustomerIds(user);
    
    if (customerIds.length === 0) {
      throw new BadRequestException('No customers found for this restaurant');
    }

    const bulkDto: BulkNotificationDto = {
      userIds: customerIds,
      type: createNotificationDto.type || NotificationType.PROMOTIONAL,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      priority: createNotificationDto.priority || NotificationPriority.MEDIUM,
      channel: createNotificationDto.channel || NotificationChannel.IN_APP,
      actionUrl: createNotificationDto.actionUrl,
      actionLabel: createNotificationDto.actionLabel,
      metadata: {
        ...createNotificationDto.metadata,
        restaurantBroadcast: true,
        broadcastBy: user.id
      }
    };

    return this.createBulk(bulkDto, user);
  }

  async getDriverOrderNotifications(query: NotificationQueryDto, user: User): Promise<any> {
    if (user.role.name !== UserRoleEnum.DRIVER) {
      throw new ForbiddenException('Only drivers can access driver order notifications');
    }

    const where: FindOptionsWhere<Notification> = {
      userId: user.id,
      type: In([
        NotificationType.DELIVERY_ASSIGNED,
        NotificationType.DELIVERY_PICKED_UP,
        NotificationType.DELIVERY_ON_THE_WAY,
        NotificationType.DELIVERY_COMPLETED,
        NotificationType.DELIVERY_DELAYED
      ])
    };

    const notifications = await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });

    return {
      notifications: notifications.map(notification => this.formatNotification(notification)),
      total: notifications.length
    };
  }

  // System notification methods for different workflows
  async notifyOrderConfirmed(userId: string, orderData: any, user?: User) {
    return this.create({
      userId,
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Order Confirmed',
      message: `Your order #${orderData.orderNumber} has been confirmed and is being prepared.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { orderId: orderData.id, orderNumber: orderData.orderNumber },
      actionUrl: `/orders/${orderData.id}`,
      actionLabel: 'View Order',
    } as CreateNotificationDto, user);
  }

  async notifyReservationConfirmed(userId: string, reservationData: any, user?: User) {
    return this.create({
      userId,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: 'Reservation Confirmed',
      message: `Your reservation for ${reservationData.date} at ${reservationData.time} has been confirmed.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { reservationId: reservationData.id },
      actionUrl: `/reservations/${reservationData.id}`,
      actionLabel: 'View Reservation',
    } as CreateNotificationDto, user);
  }

  async notifyPaymentSuccess(userId: string, paymentData: any, user?: User) {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Your payment of ${paymentData.amount} ${paymentData.currency} was successful.`,
      priority: NotificationPriority.HIGH,
      metadata: { paymentId: paymentData.id, amount: paymentData.amount },
      actionUrl: `/payments/${paymentData.id}`,
      actionLabel: 'View Payment',
    } as CreateNotificationDto, user);
  }

  async notifyDeliveryAssigned(userId: string, deliveryData: any, user?: User) {
    return this.create({
      userId,
      type: NotificationType.DELIVERY_ASSIGNED,
      title: 'Delivery Partner Assigned',
      message: `Your order is on the way! ${deliveryData.deliveryPartner} will deliver your order.`,
      priority: NotificationPriority.MEDIUM,
      metadata: { deliveryId: deliveryData.id, partner: deliveryData.deliveryPartner },
    } as CreateNotificationDto, user);
  }

  async notifyLowInventory(adminUserIds: string[], inventoryData: any, user?: User) {
    return this.createBulk({
      userIds: adminUserIds,
      type: NotificationType.LOW_INVENTORY_ALERT,
      title: 'Low Inventory Alert',
      message: `Inventory for ${inventoryData.itemName} is running low. Current stock: ${inventoryData.currentStock}`,
      priority: NotificationPriority.HIGH,
      metadata: { inventoryId: inventoryData.id, itemName: inventoryData.itemName, currentStock: inventoryData.currentStock },
      actionUrl: `/inventory/${inventoryData.id}`,
      actionLabel: 'Manage Inventory',
    } as BulkNotificationDto, user);
  }

  async notifyNewReview(reviewData: any, user?: User) {
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
    } as BulkNotificationDto, user);
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

  async cleanupExpiredNotifications(user?: User): Promise<any> {
    // Only admin can cleanup notifications
    if (!user || user.role.name !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('Only administrators can cleanup expired notifications');
    }

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at IS NOT NULL AND expires_at < :currentDate', { currentDate: new Date() })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} expired notifications`);
    return result;
  }

  private async getRestaurantCustomerIds(user: User): Promise<string[]> {
    // Simplified implementation - in real app, get from orders/reservations
    const restaurant = await this.restaurantRepository.findOne({
      where: { owner: { id: user.id } }
    });

    if (!restaurant) {
      return [];
    }

    // Get unique customer IDs from orders
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .select('DISTINCT order.userId', 'userId')
      .where('order.restaurantId = :restaurantId', { restaurantId: restaurant.id })
      .getRawMany();

    return orders.map(order => order.userId).filter((id): id is string => id !== null);
  }
}