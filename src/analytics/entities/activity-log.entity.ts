import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum ActivityAction {
  // User actions
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_PROFILE_UPDATE = 'user_profile_update',
  
  // Restaurant actions
  RESTAURANT_CREATE = 'restaurant_create',
  RESTAURANT_UPDATE = 'restaurant_update',
  RESTAURANT_DELETE = 'restaurant_delete',
  
  // Menu actions
  MENU_ITEM_CREATE = 'menu_item_create',
  MENU_ITEM_UPDATE = 'menu_item_update',
  MENU_ITEM_DELETE = 'menu_item_delete',
  
  // Order actions
  ORDER_CREATE = 'order_create',
  ORDER_UPDATE = 'order_update',
  ORDER_CANCEL = 'order_cancel',
  ORDER_COMPLETE = 'order_complete',
  
  // Reservation actions
  RESERVATION_CREATE = 'reservation_create',
  RESERVATION_UPDATE = 'reservation_update',
  RESERVATION_CANCEL = 'reservation_cancel',
  
  // Room booking actions
  ROOM_BOOKING_CREATE = 'room_booking_create',
  ROOM_BOOKING_UPDATE = 'room_booking_update',
  ROOM_BOOKING_CANCEL = 'room_booking_cancel',
  
  // Payment actions
  PAYMENT_INITIATE = 'payment_initiate',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAIL = 'payment_fail',
  PAYMENT_REFUND = 'payment_refund',
  
  // Review actions
  REVIEW_CREATE = 'review_create',
  REVIEW_UPDATE = 'review_update',
  REVIEW_DELETE = 'review_delete',
  
  // Delivery actions
  DELIVERY_ASSIGN = 'delivery_assign',
  DELIVERY_UPDATE = 'delivery_update',
  DELIVERY_COMPLETE = 'delivery_complete',
  
  // System actions
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
}

export enum EntityType {
  USER = 'user',
  RESTAURANT = 'restaurant',
  MENU_ITEM = 'menu_item',
  ORDER = 'order',
  RESERVATION = 'reservation',
  ROOM_BOOKING = 'room_booking',
  PAYMENT = 'payment',
  REVIEW = 'review',
  DELIVERY = 'delivery',
  INVENTORY = 'inventory',
}

@Entity('activity_log')
@Index(['userId', 'timestamp'])
@Index(['entityType', 'entityId'])
@Index(['action', 'timestamp'])
@Index(['timestamp'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  action: ActivityAction;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: EntityType;

  @Column({ type: 'varchar', length: 100, name: 'entity_id' })
  entityId: string;

  @Column({ type: 'nvarchar', nullable: true, name: 'old_values' })
  oldValues: string;

  @Column({ type: 'nvarchar', nullable: true, name: 'new_values' })
  newValues: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}