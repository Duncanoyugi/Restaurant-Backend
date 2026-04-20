import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { MenuItem } from '../../menu/entities/menu.entity';

@Entity('review')
@Index(['restaurantId', 'createdAt'])
@Index(['menuItemId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ nullable: true, name: 'restaurant_id' })
  restaurantId: number;

  @Column({ nullable: true, name: 'menu_item_id' })
  menuItemId: number;

  @Column({ nullable: true, name: 'order_id' })
  orderId: number;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  // Images stored as JSON array of URLs
  @Column({ type: 'varchar', nullable: true })
  images: string;

  @Column({ type: 'boolean', default: true })
  verified: boolean;

  @Column({ type: 'text', nullable: true, name: 'admin_response' })
  adminResponse: string;

  @Column({ type: 'timestamp', nullable: true, name: 'response_date' })
  responseDate: Date;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => MenuItem, (item) => item.reviews)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}