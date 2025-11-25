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

@Entity('user_behavior')
@Index(['userId', 'sessionDate'])
@Index(['sessionDate'])
export class UserBehavior {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'date', name: 'session_date' })
  sessionDate: Date;

  @Column({ type: 'varchar', length: 50, name: 'session_id' })
  sessionId: string;

  @Column({ type: 'int', name: 'page_views' })
  pageViews: number;

  @Column({ type: 'int', name: 'menu_views' })
  menuViews: number;

  @Column({ type: 'int', name: 'restaurant_views' })
  restaurantViews: number;

  @Column({ type: 'int', name: 'items_added_to_cart' })
  itemsAddedToCart: number;

  @Column({ type: 'int', name: 'checkout_attempts' })
  checkoutAttempts: number;

  @Column({ type: 'int', name: 'completed_orders' })
  completedOrders: number;

  @Column({ type: 'int', name: 'reservation_attempts' })
  reservationAttempts: number;

  @Column({ type: 'int', name: 'completed_reservations' })
  completedReservations: number;

  @Column({ type: 'int', name: 'room_booking_attempts' })
  roomBookingAttempts: number;

  @Column({ type: 'int', name: 'completed_room_bookings' })
  completedRoomBookings: number;

  @Column({ type: 'int', name: 'session_duration_seconds' })
  sessionDurationSeconds: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_type' })
  deviceType: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'browser' })
  browser: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'platform' })
  platform: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}