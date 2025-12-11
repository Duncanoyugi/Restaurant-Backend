// backend\src\menu\menu.controller.ts
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
  ClassSerializerInterceptor,
  UseGuards,
  Request,
  ForbiddenException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuSearchDto } from './dto/menu-search.dto';
import { CategorySearchDto } from './dto/category-search.dto';
import { BulkMenuItemsDto } from './dto/bulk-menu-items.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('menu')
@ApiBearerAuth('JWT-auth')
@Controller('menu')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  // Category endpoints - Restaurant Owner and Admin only
  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new menu category (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiBody({ type: CreateCategoryDto })
  createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return this.menuService.createCategory(createCategoryDto, req.user);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all menu categories with filtering' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiQuery({ type: CategorySearchDto })
  findAllCategories(@Query() searchDto: CategorySearchDto) {
    return this.menuService.findAllCategories(searchDto);
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get menu category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  findCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update menu category by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  @ApiBody({ type: UpdateCategoryDto })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req
  ) {
    return this.menuService.updateCategory(id, updateCategoryDto, req.user);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete menu category by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  removeCategory(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.menuService.removeCategory(id, req.user);
  }

  // Menu Item endpoints - Restaurant Owner and Admin only for write operations
  @Post('items')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new menu item (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 201, description: 'Menu item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiBody({ type: CreateMenuItemDto })
  createMenuItem(@Body() createMenuItemDto: CreateMenuItemDto, @Request() req) {
    return this.menuService.createMenuItem(createMenuItemDto, req.user);
  }

  @Post('items/bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create multiple menu items in bulk (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 201, description: 'Menu items created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiBody({ type: BulkMenuItemsDto })
  createBulkMenuItems(@Body() bulkDto: BulkMenuItemsDto, @Request() req) {
    return this.menuService.createBulkMenuItems(bulkDto, req.user);
  }

  @Public()
  @Get('items')
  @ApiOperation({ summary: 'Get all menu items with filtering' })
  @ApiResponse({ status: 200, description: 'Menu items retrieved successfully' })
  @ApiQuery({ type: MenuSearchDto })
  findAllMenuItems(@Query() searchDto: MenuSearchDto) {
    return this.menuService.findAllMenuItems(searchDto);
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: 'Get menu item by ID' })
  @ApiResponse({ status: 200, description: 'Menu item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: Number })
  findMenuItemById(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findMenuItemById(id);
  }

  @Patch('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Update menu item by ID (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: Number })
  @ApiBody({ type: UpdateMenuItemDto })
  updateMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @Request() req
  ) {
    return this.menuService.updateMenuItem(id, updateMenuItemDto, req.user);
  }

  @Patch('items/:id/toggle-availability')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Toggle menu item availability (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Menu item availability toggled successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: Number })
  toggleMenuItemAvailability(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.menuService.toggleMenuItemAvailability(id, req.user);
  }

  @Delete('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete menu item by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Menu item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: Number })
  removeMenuItem(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.menuService.removeMenuItem(id, req.user);
  }

  // Restaurant-specific menu endpoints - Public read access
  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get restaurant menu with optional category filter' })
  @ApiResponse({ status: 200, description: 'Restaurant menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiQuery({ name: 'categoryId', description: 'Category ID to filter by', required: false })
  getRestaurantMenu(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('categoryId') categoryId?: number
  ) {
    return this.menuService.getRestaurantMenu(restaurantId, categoryId);
  }

  @Public()
  @Get('restaurant/:restaurantId/featured')
  @ApiOperation({ summary: 'Get featured menu items for restaurant' })
  @ApiResponse({ status: 200, description: 'Featured items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of featured items to return', required: false, type: Number })
  getFeaturedMenuItems(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.menuService.getFeaturedMenuItems(restaurantId, limit);
  }

  @Get('restaurant/:restaurantId/statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get menu statistics for restaurant (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Menu statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getMenuStatistics(@Param('restaurantId', ParseIntPipe) restaurantId: number, @Request() req) {
    return this.menuService.getMenuStatistics(restaurantId, req.user);
  }

  @Public()
  @Get('restaurant/:restaurantId/price-range')
  @ApiOperation({ summary: 'Get menu price range for restaurant' })
  @ApiResponse({ status: 200, description: 'Price range calculated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getMenuPriceRange(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.menuService.getMenuPriceRange(restaurantId);
  }

  // Search and filter endpoints - Public access
  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search menu items by query' })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'restaurantId', description: 'Restaurant ID to filter by', required: false })
  searchMenuItems(
    @Query('q') query: string,
    @Query('restaurantId', ParseIntPipe) restaurantId?: number
  ) {
    return this.menuService.searchMenuItems(query, restaurantId);
  }

  @Public()
  @Get('filter/allergens')
  @ApiOperation({ summary: 'Filter menu items by allergens' })
  @ApiResponse({ status: 200, description: 'Filter completed successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiQuery({ name: 'restaurantId', description: 'Restaurant ID', required: true, type: Number })
  @ApiQuery({ name: 'allergens', description: 'Comma-separated list of allergens to exclude', required: true })
  getMenuItemsByAllergens(
    @Query('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('allergens') allergens: string
  ) {
    const allergensArray = allergens ? allergens.split(',') : [];
    return this.menuService.getMenuItemsByAllergens(restaurantId, allergensArray);
  }

  // Global featured items - Public access
  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get globally featured menu items' })
  @ApiResponse({ status: 200, description: 'Featured items retrieved successfully' })
  @ApiQuery({ name: 'limit', description: 'Number of featured items to return', required: false, type: Number })
  getGlobalFeaturedItems(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.menuService.getFeaturedMenuItems(undefined, limit);
  }

  // Restaurant Owner specific endpoints
  @Get('my-restaurant/menu')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get current user restaurant menu (Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Restaurant menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner or Staff access required' })
  getMyRestaurantMenu(@Request() req) {
    return this.menuService.getMyRestaurantMenu(req.user);
  }

  @Get('my-restaurant/statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get current user restaurant menu statistics (Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Menu statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner or Staff access required' })
  getMyRestaurantStatistics(@Request() req) {
    return this.menuService.getMyRestaurantStatistics(req.user);
  }
}