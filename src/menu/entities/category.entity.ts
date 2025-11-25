import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MenuItem } from './menu.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 1 })
  active: boolean;

  @OneToMany(() => MenuItem, (item) => item.category)
  menuItems: MenuItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}