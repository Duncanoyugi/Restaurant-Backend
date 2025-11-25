import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  // User notifications
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_READY = 'order_ready',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  
  // Reservation notifications
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  RESERVATION_REMINDER = 'reservation_reminder',
  RESERVATION_CANCELLED = 'reservation_cancelled',
  RESERVATION_UPDATED = 'reservation_updated',
  
  // Room booking notifications
  ROOM_BOOKING_CONFIRMED = 'room_booking_confirmed',
  ROOM_BOOKING_REMINDER = 'room_booking_reminder',
  ROOM_BOOKING_CANCELLED = 'room_booking_cancelled',
  ROOM_CHECKIN_REMINDER = 'room_checkin_reminder',
  ROOM_CHECKOUT_REMINDER = 'room_checkout_reminder',
  
  // Payment notifications
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  
  // Delivery notifications
  DELIVERY_ASSIGNED = 'delivery_assigned',
  DELIVERY_PICKED_UP = 'delivery_picked_up',
  DELIVERY_ON_THE_WAY = 'delivery_on_the_way',
  DELIVERY_COMPLETED = 'delivery_completed',
  DELIVERY_DELAYED = 'delivery_delayed',
  
  // Review notifications
  REVIEW_REMINDER = 'review_reminder',
  REVIEW_RECEIVED = 'review_received',
  REVIEW_RESPONDED = 'review_responded',
  
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  PROMOTIONAL = 'promotional',
  SECURITY_ALERT = 'security_alert',
  
  // Admin notifications
  NEW_ORDER_RECEIVED = 'new_order_received',
  NEW_RESERVATION_RECEIVED = 'new_reservation_received',
  NEW_ROOM_BOOKING_RECEIVED = 'new_room_booking_received',
  LOW_INVENTORY_ALERT = 'low_inventory_alert',
  HIGH_DEMAND_ALERT = 'high_demand_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Entity('notification')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Column({ type: 'nvarchar', nullable: true })
  metadata: string; // JSON data for additional context

  @Column({ type: 'varchar', length: 50, default: NotificationChannel.IN_APP })
  channel: NotificationChannel;

  @Column({ type: 'bit', default: 0, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'bit', default: 0, name: 'is_sent' })
  isSent: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'scheduled_for' })
  scheduledFor: Date; // For scheduled notifications

  @Column({ type: 'datetime', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'action_url' })
  actionUrl: string; // URL for notification action

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'action_label' })
  actionLabel: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}