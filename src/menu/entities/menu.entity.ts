import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Category } from './category.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Review } from '../../review/entities/review.entity';

@Entity('menu_item')
@Index(['restaurantId', 'categoryId'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  ingredients: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  imageUrl: string;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 1 })
  available: boolean;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 0, name: 'is_featured' })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0, name: 'preparation_time' })
  preparationTime: number; // in minutes

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  calories: number;

  @Column({ type: 'nvarchar', nullable: true })
  allergens: string | null;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuItems)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => Category, (category) => category.menuItems)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menuItem)
  orderItems: OrderItem[];

  @OneToMany(() => Review, (review) => review.menuItem)
  reviews: Review[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}