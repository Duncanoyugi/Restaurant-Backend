import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_roles')
export class UserRole {
  // FIX: Add primary column
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  name: string; // Admin, Restaurant Owner, Restaurant Staff, Customer, Driver

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  // FIX: Use text or nvarchar for JSON in MSSQL
  @Column({ type: 'nvarchar', nullable: true })
  permissions: string; // Store as JSON string

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}