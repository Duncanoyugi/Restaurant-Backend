import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuSearchDto } from './dto/menu-search.dto';
import { CategorySearchDto } from './dto/category-search.dto';
import { BulkMenuItemsDto } from './dto/bulk-menu-items.dto';

@Controller('menu')
@UseInterceptors(ClassSerializerInterceptor)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Category endpoints
  @Post('categories')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.menuService.createCategory(createCategoryDto);
  }

  @Get('categories')
  findAllCategories(@Query() searchDto: CategorySearchDto) {
    return this.menuService.findAllCategories(searchDto);
  }

  @Get('categories/:id')
  findCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findCategoryById(id);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.menuService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.removeCategory(id);
  }

  // Menu Item endpoints
  @Post('items')
  createMenuItem(@Body() createMenuItemDto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(createMenuItemDto);
  }

  @Post('items/bulk')
  createBulkMenuItems(@Body() bulkDto: BulkMenuItemsDto) {
    return this.menuService.createBulkMenuItems(bulkDto);
  }

  @Get('items')
  findAllMenuItems(@Query() searchDto: MenuSearchDto) {
    return this.menuService.findAllMenuItems(searchDto);
  }

  @Get('items/:id')
  findMenuItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findMenuItemById(id);
  }

  @Patch('items/:id')
  updateMenuItem(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateMenuItemDto: UpdateMenuItemDto
  ) {
    return this.menuService.updateMenuItem(id, updateMenuItemDto);
  }

  @Patch('items/:id/toggle-availability')
  toggleMenuItemAvailability(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.toggleMenuItemAvailability(id);
  }

  @Delete('items/:id')
  removeMenuItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.removeMenuItem(id);
  }

  // Restaurant-specific menu endpoints
  @Get('restaurant/:restaurantId')
  getRestaurantMenu(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.menuService.getRestaurantMenu(restaurantId, categoryId);
  }

  @Get('restaurant/:restaurantId/featured')
  getFeaturedMenuItems(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.menuService.getFeaturedMenuItems(restaurantId, limit);
  }

  @Get('restaurant/:restaurantId/statistics')
  getMenuStatistics(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.getMenuStatistics(restaurantId);
  }

  @Get('restaurant/:restaurantId/price-range')
  getMenuPriceRange(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.getMenuPriceRange(restaurantId);
  }

  // Search and filter endpoints
  @Get('search')
  searchMenuItems(
    @Query('q') query: string,
    @Query('restaurantId') restaurantId?: string
  ) {
    return this.menuService.searchMenuItems(query, restaurantId);
  }

  @Get('filter/allergens')
  getMenuItemsByAllergens(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('allergens') allergens: string
  ) {
    const allergensArray = allergens ? allergens.split(',') : [];
    return this.menuService.getMenuItemsByAllergens(restaurantId, allergensArray);
  }

  // Global featured items
  @Get('featured')
  getGlobalFeaturedItems(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.menuService.getFeaturedMenuItems(undefined, limit);
  }
}