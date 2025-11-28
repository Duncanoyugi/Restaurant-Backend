import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './entities/inventory.entity';
import { Supplier } from './entities/supplier.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { UserModule } from '../user/user.module'; // ADD THIS IMPORT

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryItem,
      Supplier,
      StockTransaction
    ]),
    RestaurantModule, // Provides RestaurantRepository
    UserModule, // ADD THIS - Provides UserRepository
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService, TypeOrmModule],
})
export class InventoryModule {}