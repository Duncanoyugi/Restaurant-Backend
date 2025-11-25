import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.entity';
import { StatusCatalog } from './entities/status-catalog.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderStatus,
      StatusCatalog
    ])
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}