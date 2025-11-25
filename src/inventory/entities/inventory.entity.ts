import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Supplier } from './supplier.entity';
import { StockTransaction } from './stock-transaction.entity';

@Entity('inventory_item')
@Index(['restaurantId', 'category'])
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string; // kg, liters, pieces, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'int' })
  threshold: number; // Minimum stock level

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => Supplier, (supplier) => supplier.inventoryItems)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => StockTransaction, (transaction) => transaction.inventoryItem)
  transactions: StockTransaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}