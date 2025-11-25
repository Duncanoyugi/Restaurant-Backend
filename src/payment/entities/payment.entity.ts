import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';
import { RoomBooking } from '../../room/entities/room-booking.entity';
import { Invoice } from './invoice.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK = 'bank',
  USSD = 'ussd',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('payment')
@Index(['reference'])
@Index(['userId', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true, name: 'reservation_id' })
  reservationId: string;

  @Column({ type: 'uuid', nullable: true, name: 'room_booking_id' })
  roomBookingId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 50, default: PaymentMethod.CARD })
  method: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'access_code' })
  accessCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'authorization_url' })
  authorizationUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'gateway_response' })
  gatewayResponse: string;

  @Column({ type: 'nvarchar', nullable: true })
  metadata: string;

  @Column({ type: 'datetime', nullable: true, name: 'paid_at' })
  paidAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  channel: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'customer_email' })
  customerEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'customer_name' })
  customerName: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToOne(() => Reservation, (reservation) => reservation.payment)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @OneToOne(() => RoomBooking, (booking) => booking.payment)
  @JoinColumn({ name: 'room_booking_id' })
  roomBooking: RoomBooking;

  @OneToMany(() => Invoice, (invoice) => invoice.payment)
  invoices: Invoice[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}