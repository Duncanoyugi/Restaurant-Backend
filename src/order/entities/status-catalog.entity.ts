import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus } from './order-status.entity';

@Entity('status_catalog')
export class StatusCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string; // Pending, Preparing, Ready, Out for Delivery, Delivered, Cancelled

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string; // For UI display

  @OneToMany(() => OrderStatus, (orderStatus) => orderStatus.statusCatalog)
  orderStatuses: OrderStatus[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}