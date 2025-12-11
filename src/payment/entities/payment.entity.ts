// backend\src\payment\entities\payment.entity.ts
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

export enum PaymentGateway {
  PAYSTACK = 'paystack',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  payment_number: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorization_url?: string;

  // Add explicit user_id column
  @Column({ nullable: false })
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'KES' })
  currency: string;

  @Column({ type: 'varchar', length: 50 })
  payment_method: PaymentMethod;

  @Column({ type: 'varchar', length: 50 })
  gateway: PaymentGateway;

  @Column({ type: 'varchar', length: 100, unique: true })
  payment_reference: string;

  @Column({ type: 'varchar', length: 50, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_reference?: string;

  @Column({ type: 'varchar', length: 4000, nullable: true })
  gateway_response?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failure_reason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refunded_amount: number;

  @Column({
    type: 'datetime2',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  processed_at?: Date;

  @Column({ type: 'datetime2', nullable: true })
  failed_at?: Date;

  @Column({ type: 'datetime2', nullable: true })
  paid_at?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channel?: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  metadata?: string;

  @Column({ type: 'bit', default: false })
  delivery_initiated: boolean;

  @Column({ type: 'int', nullable: true })
  delivery_reference?: number;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  delivery_error?: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  callback_url?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ------------------------
  // RELATIONS
  // ------------------------

  @ManyToOne(() => Order, (order) => order.payment, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Reservation, (reservation) => reservation.payment, { nullable: true })
  @JoinColumn({ name: 'reservation_id' })
  reservation?: Reservation;

  @OneToOne(() => RoomBooking, (roomBooking) => roomBooking.payment, { nullable: true })
  @JoinColumn({ name: 'room_booking_id' })
  roomBooking?: RoomBooking;

  @OneToMany(() => Invoice, (invoice) => invoice.payment)
  invoices: Invoice[];

  // ------------------------
  // GETTERS
  // ------------------------

  get userId(): number {
    return this.user_id;
  }

  get orderId(): number | undefined {
    return this.order?.id;
  }

  get reservationId(): number | undefined {
    return this.reservation?.id;
  }

  get roomBookingId(): number | undefined {
    return this.roomBooking?.id;
  }

  get reference(): string {
    return this.payment_reference;
  }

  get paidAt(): Date | undefined {
    return this.paid_at;
  }

  get createdAt(): Date {
    return this.created_at;
  }

  get gatewayResponse(): any {
    return this.gateway_response;
  }
}