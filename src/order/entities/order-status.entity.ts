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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'status_catalog_id' })
  statusCatalogId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;

  @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => StatusCatalog, (status) => status.orderStatuses)
  @JoinColumn({ name: 'status_catalog_id' })
  statusCatalog: StatusCatalog;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}