import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/entities/user.entity';

@Entity('refresh_tokens')
@Index(['userId'])
@Index(['token'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 0 })
  revoked: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}