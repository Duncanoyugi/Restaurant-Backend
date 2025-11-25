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
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { City } from './city.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'street_address_1' })
  streetAddress1: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'street_address_2' })
  streetAddress2: string;

  @Column({ type: 'varchar', length: 20, name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string; // Home, Office, etc.

  @Column({ type: 'bit', default: 0, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'uuid', name: 'city_id' })
  cityId: string;

  @Column({ type: 'text', nullable: true, name: 'delivery_instructions' })
  deliveryInstructions: string;

  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => City, (city) => city.addresses)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @OneToMany(() => Order, (order) => order.deliveryAddress)
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}