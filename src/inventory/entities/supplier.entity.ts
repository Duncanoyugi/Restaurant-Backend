import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InventoryItem } from './inventory.entity';

@Entity('supplier')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, name: 'contact_name' })
  contactName: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 1 })
  active: boolean;

  @OneToMany(() => InventoryItem, (item) => item.supplier)
  inventoryItems: InventoryItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}