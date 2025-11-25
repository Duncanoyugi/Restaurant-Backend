import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('vehicle_info')
export class VehicleInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'vehicle_make' })
  vehicleMake: string;

  @Column({ type: 'varchar', length: 50, name: 'vehicle_model' })
  vehicleModel: string;

  @Column({ type: 'varchar', length: 4, name: 'vehicle_year' })
  vehicleYear: string;

  @Column({ type: 'varchar', length: 20, name: 'license_plate', unique: true })
  licensePlate: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'license_number' })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vehicle_type' })
  vehicleType: string; // Motorcycle, Car, Bicycle, etc.

  @OneToOne(() => User, (user) => user.vehicleInfo)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}