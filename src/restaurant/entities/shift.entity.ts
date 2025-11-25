import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RestaurantStaff } from './restaurant-staff.entity';

@Entity('shift')
@Index(['staffId', 'shiftDate'])
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'staff_id' })
  staffId: string;

  @Column({ type: 'datetime', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'date', name: 'shift_date' })
  shiftDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string; // Scheduled, Completed, Cancelled

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => RestaurantStaff, (staff) => staff.shifts)
  @JoinColumn({ name: 'staff_id' })
  staff: RestaurantStaff;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}