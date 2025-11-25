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
import { City } from '../../location/entities/city.entity';
import { User } from '../../user/entities/user.entity';
import { MenuItem } from '../../menu/entities/menu.entity';
import { Table } from '../../reservation/entities/table.entity';
import { Room } from '../../room/entities/room.entity';
import { Order } from '../../order/entities/order.entity';
import { RestaurantStaff } from './restaurant-staff.entity';

@Entity('restaurant')
@Index(['email'])
@Index(['phone'])
@Index(['ownerId'])
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'street_address' })
  streetAddress: string;

  @Column({ type: 'varchar', length: 20, name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cover_image_url' })
  coverImageUrl: string;

  @Column({ type: 'time', nullable: true, name: 'opening_time' })
  openingTime: string;

  @Column({ type: 'time', nullable: true, name: 'closing_time' })
  closingTime: string;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 1 })
  active: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'uuid', name: 'city_id' })
  cityId: string;

  @ManyToOne(() => User, (user) => user.ownedRestaurants)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => City, (city) => city.restaurants)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @OneToMany(() => MenuItem, (item) => item.restaurant)
  menuItems: MenuItem[];

  @OneToMany(() => Table, (table) => table.restaurant)
  tables: Table[];

  @OneToMany(() => Room, (room) => room.restaurant)
  rooms: Room[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @OneToMany(() => RestaurantStaff, (staff) => staff.restaurant)
  staff: RestaurantStaff[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}