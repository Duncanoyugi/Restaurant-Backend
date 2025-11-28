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
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('menu')
@ApiBearerAuth('JWT-auth')
@Controller('menu')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

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

  @Get('categories')
  @ApiOperation({ summary: 'Get all menu categories with filtering' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiQuery({ type: CategorySearchDto })
  findAllCategories(@Query() searchDto: CategorySearchDto) {
    return this.menuService.findAllCategories(searchDto);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get menu category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category ID', type: String })
  findCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update menu category by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Category ID', type: String })
  @ApiBody({ type: UpdateCategoryDto })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string, 
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
  @ApiParam({ name: 'id', description: 'Category ID', type: String })
  removeCategory(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
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

  @Get('items')
  @ApiOperation({ summary: 'Get all menu items with filtering' })
  @ApiResponse({ status: 200, description: 'Menu items retrieved successfully' })
  @ApiQuery({ type: MenuSearchDto })
  findAllMenuItems(@Query() searchDto: MenuSearchDto) {
    return this.menuService.findAllMenuItems(searchDto);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get menu item by ID' })
  @ApiResponse({ status: 200, description: 'Menu item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: String })
  findMenuItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findMenuItemById(id);
  }

  @Patch('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Update menu item by ID (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: String })
  @ApiBody({ type: UpdateMenuItemDto })
  updateMenuItem(
    @Param('id', ParseUUIDPipe) id: string, 
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
  @ApiParam({ name: 'id', description: 'Menu item ID', type: String })
  toggleMenuItemAvailability(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.menuService.toggleMenuItemAvailability(id, req.user);
  }

  @Delete('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete menu item by ID (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Menu item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Menu item ID', type: String })
  removeMenuItem(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.menuService.removeMenuItem(id, req.user);
  }

  // Restaurant-specific menu endpoints - Public read access
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get restaurant menu with optional category filter' })
  @ApiResponse({ status: 200, description: 'Restaurant menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'categoryId', description: 'Category ID to filter by', required: false })
  getRestaurantMenu(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.menuService.getRestaurantMenu(restaurantId, categoryId);
  }

  @Get('restaurant/:restaurantId/featured')
  @ApiOperation({ summary: 'Get featured menu items for restaurant' })
  @ApiResponse({ status: 200, description: 'Featured items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'limit', description: 'Number of featured items to return', required: false, type: Number })
  getFeaturedMenuItems(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
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
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getMenuStatistics(@Param('restaurantId', ParseUUIDPipe) restaurantId: string, @Request() req) {
    return this.menuService.getMenuStatistics(restaurantId, req.user);
  }

  @Get('restaurant/:restaurantId/price-range')
  @ApiOperation({ summary: 'Get menu price range for restaurant' })
  @ApiResponse({ status: 200, description: 'Price range calculated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getMenuPriceRange(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.getMenuPriceRange(restaurantId);
  }

  // Search and filter endpoints - Public access
  @Get('search')
  @ApiOperation({ summary: 'Search menu items by query' })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'restaurantId', description: 'Restaurant ID to filter by', required: false })
  searchMenuItems(
    @Query('q') query: string,
    @Query('restaurantId') restaurantId?: string
  ) {
    return this.menuService.searchMenuItems(query, restaurantId);
  }

  @Get('filter/allergens')
  @ApiOperation({ summary: 'Filter menu items by allergens' })
  @ApiResponse({ status: 200, description: 'Filter completed successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiQuery({ name: 'restaurantId', description: 'Restaurant ID', required: true, type: String })
  @ApiQuery({ name: 'allergens', description: 'Comma-separated list of allergens to exclude', required: true })
  getMenuItemsByAllergens(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('allergens') allergens: string
  ) {
    const allergensArray = allergens ? allergens.split(',') : [];
    return this.menuService.getMenuItemsByAllergens(restaurantId, allergensArray);
  }

  // Global featured items - Public access
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