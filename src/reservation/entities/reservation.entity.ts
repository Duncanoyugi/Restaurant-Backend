// FIX: Use string enums for MSSQL compatibility
export enum ReservationType {
  TABLE = 'table',
  FULL_RESTAURANT = 'full_restaurant',
}

export enum ReservationStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
  NO_SHOW = 'No Show',
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Table } from './table.entity';
import { Payment } from '../../payment/entities/payment.entity';

@Entity('reservation')
@Index(['restaurantId', 'reservationDate'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'reservation_number' })
  reservationNumber: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'uuid', nullable: true, name: 'table_id' })
  tableId: string;

  // FIX: Change enum to varchar for MSSQL
  @Column({ type: 'varchar', length: 20, name: 'reservation_type' })
  reservationType: ReservationType;

  @Column({ type: 'date', name: 'reservation_date' })
  reservationDate: Date;

  @Column({ type: 'time', name: 'reservation_time' })
  reservationTime: string;

  @Column({ type: 'int', name: 'guest_count' })
  guestCount: number;

  @Column({ type: 'text', nullable: true, name: 'special_request' })
  specialRequest: string;

  // FIX: Change enum to varchar for MSSQL
  @Column({ type: 'varchar', length: 20, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Column({ type: 'uuid', nullable: true, name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'deposit_amount' })
  depositAmount: number;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.reservations)
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @OneToOne(() => Payment, (payment) => payment.reservation)
  payment: Payment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}