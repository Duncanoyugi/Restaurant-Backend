// FIX: Use string enum for MSSQL compatibility
export enum TableStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  OCCUPIED = 'Occupied',
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Reservation } from './reservation.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('table')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'varchar', length: 20, name: 'table_number' })
  tableNumber: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string; // Indoor, Outdoor, VIP, etc.

  // FIX: Change enum to varchar for MSSQL
  @Column({ type: 'varchar', length: 20, default: TableStatus.AVAILABLE })
  status: TableStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'minimum_charge' })
  minimumCharge: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @OneToMany(() => Reservation, (reservation) => reservation.table)
  reservations: Reservation[];

  @OneToMany(() => Order, (order) => order.table)
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}