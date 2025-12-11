import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { StatusCatalog } from './status-catalog.entity';

@Entity('order_status')
export class OrderStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'status_catalog_id' })
  statusCatalogId: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true, name: 'updated_by' })
  updatedBy: number;

  @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => StatusCatalog, (status) => status.orderStatuses)
  @JoinColumn({ name: 'status_catalog_id' })
  statusCatalog: StatusCatalog;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}