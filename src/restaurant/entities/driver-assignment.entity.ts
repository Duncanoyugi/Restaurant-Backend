import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { User } from '../../user/entities/user.entity';

@Entity('driver_assignments')
export class DriverAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'restaurant_id' })
  restaurantId: number;

  @Column({ name: 'driver_id' })
  driverId: number;

  @Column({ nullable: true })
  vehicleType: string;

  @Column({ nullable: true })
  licensePlate: string;

  @Column({ default: 'active' })
  status: string; // active, inactive, busy

  @Column({ type: 'simple-json', nullable: true })
  workingHours: {
    start: string;
    end: string;
    days: string[]; // ['monday', 'tuesday', ...]
  };

  @CreateDateColumn()
  assignedAt: Date;

  // RELATIONSHIPS
  @ManyToOne(() => Restaurant, restaurant => restaurant.driverAssignments)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User, user => user.driverAssignments)
  @JoinColumn({ name: 'driver_id' })
  driver: User;
}