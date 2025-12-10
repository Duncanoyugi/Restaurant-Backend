import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuItem } from './entities/menu.entity';
import { Category } from './entities/category.entity';
import { RestaurantModule } from '../restaurant/restaurant.module'; // Add this import
import { MenuSeeder } from './menu.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItem,
      Category
    ]),
    RestaurantModule, // Add this line to import RestaurantModule
  ],
  controllers: [MenuController],
  providers: [MenuService, MenuSeeder],
  exports: [MenuService, TypeOrmModule],
})
export class MenuModule { }