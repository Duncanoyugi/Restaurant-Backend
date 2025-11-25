import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InventoryItem } from './inventory.entity';

// FIX: Use string enum for MSSQL compatibility
export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_transaction')
@Index(['inventoryItemId', 'createdAt'])
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'inventory_item_id' })
  inventoryItemId: string;

  @Column({ type: 'int', name: 'quantity_change' })
  quantityChange: number;

  // FIX: Change enum to varchar for MSSQL
  @Column({ type: 'varchar', length: 20, name: 'transaction_type' })
  transactionType: TransactionType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_id' })
  referenceId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @Column({ type: 'uuid', nullable: true, name: 'performed_by' })
  performedBy: string;

  @ManyToOne(() => InventoryItem, (item) => item.transactions)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}