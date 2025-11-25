import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './entities/inventory.entity';
import { Supplier } from './entities/supplier.entity';
import { StockTransaction } from './entities/stock-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryItem,
      Supplier,
      StockTransaction
    ])
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService, TypeOrmModule],
})
export class InventoryModule {}