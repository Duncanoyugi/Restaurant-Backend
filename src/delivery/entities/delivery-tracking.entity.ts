import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { User } from '../../user/entities/user.entity';

@Entity('delivery_tracking')
@Index(['orderId', 'createdAt'])
export class DeliveryTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'driver_id' })
  driverId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number; // km/h

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heading: number; // degrees

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'distance_to_destination' })
  distanceToDestination: number; // in km

  @Column({ type: 'int', nullable: true, name: 'eta_minutes' })
  etaMinutes: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string; // picked_up, on_the_way, nearby, arrived

  @ManyToOne(() => Order, (order) => order.deliveryTracking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}