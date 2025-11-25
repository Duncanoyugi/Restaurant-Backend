// FIX: Use string enum for MSSQL compatibility
export enum OrderType {
  DINE_IN = 'dine-in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { User } from '../../user/entities/user.entity';
import { Table } from '../../reservation/entities/table.entity';
import { Address } from '../../location/entities/address.entity';
import { StatusCatalog } from './status-catalog.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.entity';
import { DeliveryTracking } from '../../delivery/entities/delivery-tracking.entity';

@Entity('orders')
@Index(['restaurantId', 'userId'])
@Index(['createdAt'])
@Index(['driverId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'driver_id' })
  driverId: string;

  @Column({ type: 'uuid', nullable: true, name: 'table_id' })
  tableId: string;

  @Column({ type: 'uuid', nullable: true, name: 'delivery_address_id' })
  deliveryAddressId: string;

  // FIX: Change enum to varchar for MSSQL
  @Column({ type: 'varchar', length: 20, name: 'order_type' })
  orderType: OrderType;

  @Column({ type: 'uuid', nullable: true, name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'uuid', name: 'status_id' })
  statusId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'delivery_fee' })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'final_price' })
  finalPrice: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'datetime', nullable: true, name: 'estimated_delivery_time' })
  estimatedDeliveryTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'actual_delivery_time' })
  actualDeliveryTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'scheduled_time' })
  scheduledTime: Date;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.deliveries)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => Table, (table) => table.orders)
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @ManyToOne(() => Address, (address) => address.orders)
  @JoinColumn({ name: 'delivery_address_id' })
  deliveryAddress: Address;

  @ManyToOne(() => StatusCatalog)
  @JoinColumn({ name: 'status_id' })
  status: StatusCatalog;

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  orderItems: OrderItem[];

  @OneToMany(() => OrderStatus, (status) => status.order, { cascade: true })
  statusHistory: OrderStatus[];

  @OneToMany(() => DeliveryTracking, (tracking) => tracking.order, { cascade: true })
  deliveryTracking: DeliveryTracking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}