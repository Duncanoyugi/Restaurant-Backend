// FIX: Use string enum for MSSQL compatibility
export enum RoomBookingStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
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
import { Room } from './room.entity';
import { User } from '../../user/entities/user.entity';
import { Payment } from '../../payment/entities/payment.entity';

@Entity('room_booking')
@Index(['roomId', 'checkInDate'])
export class RoomBooking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'booking_number' })
  bookingNumber: string;

  @Column({ name: 'room_id' })
  roomId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'date', name: 'check_in_date' })
  checkInDate: Date;

  @Column({ type: 'date', name: 'check_out_date' })
  checkOutDate: Date;

  @Column({ type: 'int', name: 'number_of_guests' })
  numberOfGuests: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  // FIX: Remove enum type and use varchar instead
  @Column({ type: 'varchar', length: 20, default: 'Pending' })
  status: RoomBookingStatus;

  @Column({ nullable: true, name: 'payment_id' })
  paymentId: number;

  @Column({ type: 'text', nullable: true, name: 'special_requests' })
  specialRequests: string;

  @ManyToOne(() => Room, (room) => room.bookings)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Payment, (payment) => payment.roomBooking)
  payment: Payment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}