// backend\src\inventory\inventory.controller.ts
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
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { InventorySearchDto } from './dto/inventory-search.dto';
import { SupplierSearchDto } from './dto/supplier-search.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Supplier endpoints
  @Post('suppliers')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new supplier (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiBody({ type: CreateSupplierDto })
  createSupplier(@Body() createSupplierDto: CreateSupplierDto, @Request() req) {
    return this.inventoryService.createSupplier(createSupplierDto, req.user);
  }

  @Get('suppliers')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get all suppliers with filtering (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiQuery({ type: SupplierSearchDto })
  findAllSuppliers(@Query() searchDto: SupplierSearchDto, @Request() req) {
    return this.inventoryService.findAllSuppliers(searchDto, req.user);
  }

  @Get('suppliers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get supplier by ID (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'id', description: 'Supplier ID', type: Number })
  findSupplierById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inventoryService.findSupplierById(id, req.user);
  }

  @Patch('suppliers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update supplier by ID (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Supplier ID', type: Number })
  @ApiBody({ type: UpdateSupplierDto })
  updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Request() req
  ) {
    return this.inventoryService.updateSupplier(id, updateSupplierDto, req.user);
  }

  @Delete('suppliers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete supplier by ID (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Supplier ID', type: Number })
  removeSupplier(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inventoryService.removeSupplier(id, req.user);
  }

  // Inventory Item endpoints
  @Post('items')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Create a new inventory item (Admin/Restaurant only)' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiBody({ type: CreateInventoryItemDto })
  createInventoryItem(@Body() createInventoryItemDto: CreateInventoryItemDto, @Request() req) {
    return this.inventoryService.createInventoryItem(createInventoryItemDto, req.user);
  }

  @Get('items')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get all inventory items with filtering (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiQuery({ type: InventorySearchDto })
  findAllInventoryItems(@Query() searchDto: InventorySearchDto, @Request() req) {
    return this.inventoryService.findAllInventoryItems(searchDto, req.user);
  }

  @Get('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get inventory item by ID (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: Number })
  findInventoryItemById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inventoryService.findInventoryItemById(id, req.user);
  }

  @Patch('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Update inventory item by ID (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: Number })
  @ApiBody({ type: UpdateInventoryItemDto })
  updateInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
    @Request() req
  ) {
    return this.inventoryService.updateInventoryItem(id, updateInventoryItemDto, req.user);
  }

  @Delete('items/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete inventory item by ID (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: Number })
  removeInventoryItem(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inventoryService.removeInventoryItem(id, req.user);
  }

  // Stock Transaction endpoints
  @Post('transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Create stock transaction (Admin/Restaurant only)' })
  @ApiResponse({ status: 201, description: 'Stock transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiBody({ type: CreateStockTransactionDto })
  createStockTransaction(@Body() createTransactionDto: CreateStockTransactionDto, @Request() req) {
    return this.inventoryService.createStockTransaction(createTransactionDto, req.user);
  }

  @Get('items/:id/transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get stock transactions for inventory item (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Stock transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: Number })
  @ApiQuery({ name: 'days', description: 'Number of days to look back', required: false, type: Number })
  getStockTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Request() req
  ) {
    return this.inventoryService.getStockTransactions(id, days, req.user);
  }

  // Stock Management endpoints
  @Post('adjust-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Adjust stock quantity (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment data' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiBody({ type: StockAdjustmentDto })
  adjustStock(@Body() adjustmentDto: StockAdjustmentDto, @Request() req) {
    return this.inventoryService.adjustStock(adjustmentDto, req.user);
  }

  @Post('transfer-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Transfer stock between locations (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Stock transferred successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transfer data or insufficient stock' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiBody({ type: StockTransferDto })
  transferStock(@Body() transferDto: StockTransferDto, @Request() req) {
    return this.inventoryService.transferStock(transferDto, req.user);
  }

  // Analytics and Reporting endpoints
  @Get('restaurant/:restaurantId/low-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get low stock items for restaurant (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getLowStockItems(@Param('restaurantId', ParseIntPipe) restaurantId: number, @Request() req) {
    return this.inventoryService.getLowStockItems(restaurantId, req.user);
  }

  @Get('restaurant/:restaurantId/expiring')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get expiring items for restaurant (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Expiring items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiQuery({ name: 'days', description: 'Days until expiration', required: false, type: Number })
  getExpiringItems(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    @Request() req
  ) {
    return this.inventoryService.getExpiringItems(restaurantId, days, req.user);
  }

  @Get('restaurant/:restaurantId/value')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get total inventory value for restaurant (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Inventory value calculated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getInventoryValue(@Param('restaurantId', ParseIntPipe) restaurantId: number, @Request() req) {
    return this.inventoryService.getInventoryValue(restaurantId, req.user);
  }

  @Get('restaurant/:restaurantId/category-breakdown')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get inventory breakdown by category (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Category breakdown retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getCategoryBreakdown(@Param('restaurantId', ParseIntPipe) restaurantId: number, @Request() req) {
    return this.inventoryService.getCategoryBreakdown(restaurantId, req.user);
  }

  @Get('restaurant/:restaurantId/stock-movement')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get stock movement report (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Stock movement report generated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiQuery({ name: 'days', description: 'Number of days to analyze', required: false, type: Number })
  getStockMovementReport(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Request() req
  ) {
    return this.inventoryService.getStockMovementReport(restaurantId, days, req.user);
  }

  @Get('restaurant/:restaurantId/reorder-items')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get items needing reorder (Admin/Restaurant only)' })
  @ApiResponse({ status: 200, description: 'Reorder items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant access required' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getItemsNeedingReorder(@Param('restaurantId', ParseIntPipe) restaurantId: number, @Request() req) {
    return this.inventoryService.getItemsNeedingReorder(restaurantId, req.user);
  }

  // Restaurant-specific inventory endpoints
  @Get('my-restaurant/items')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get inventory items for current user\'s restaurant' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not associated with a restaurant' })
  @ApiQuery({ type: InventorySearchDto })
  getMyRestaurantInventoryItems(@Query() searchDto: InventorySearchDto, @Request() req) {
    return this.inventoryService.getMyRestaurantInventoryItems(searchDto, req.user);
  }

  @Get('my-restaurant/low-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get low stock items for current user\'s restaurant' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not associated with a restaurant' })
  getMyRestaurantLowStockItems(@Request() req) {
    return this.inventoryService.getMyRestaurantLowStockItems(req.user);
  }

  @Get('my-restaurant/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get inventory analytics for current user\'s restaurant' })
  @ApiResponse({ status: 200, description: 'Inventory analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not associated with a restaurant' })
  getMyRestaurantInventoryAnalytics(@Request() req) {
    return this.inventoryService.getMyRestaurantInventoryAnalytics(req.user);
  }
}