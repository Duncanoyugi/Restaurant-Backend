import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { User } from '../../user/entities/user.entity';

@Entity('staff_assignments')
export class StaffAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'restaurant_id' })
  restaurantId: number;

  @Column({ name: 'staff_id' })
  staffId: number;

  @Column()
  role: string; // manager, chef, waiter, cashier, etc.

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  assignedAt: Date;

  // RELATIONSHIPS
  @ManyToOne(() => Restaurant, restaurant => restaurant.staffAssignments)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User, user => user.staffAssignments)
  @JoinColumn({ name: 'staff_id' })
  staff: User;
}