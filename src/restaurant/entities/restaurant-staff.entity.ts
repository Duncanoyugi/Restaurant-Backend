import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Restaurant } from './restaurant.entity';
import { Shift } from './shift.entity';

@Entity('restaurant_staff')
export class RestaurantStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'varchar', length: 100 })
  position: string; // Manager, Waiter, Chef, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary: number;

  @Column({ type: 'date', name: 'hire_date' })
  hireDate: Date;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 1 })
  active: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'emergency_contact' })
  emergencyContact: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_phone' })
  emergencyPhone: string;

  @OneToOne(() => User, (user) => user.restaurantStaff)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.staff)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @OneToMany(() => Shift, (shift) => shift.staff)
  shifts: Shift[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}