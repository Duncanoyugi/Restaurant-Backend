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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
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

@ApiTags('inventory')
@Controller('inventory')
@UseInterceptors(ClassSerializerInterceptor)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Supplier endpoints
  @Post('suppliers')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateSupplierDto })
  createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(createSupplierDto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers with filtering' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  @ApiQuery({ type: SupplierSearchDto })
  findAllSuppliers(@Query() searchDto: SupplierSearchDto) {
    return this.inventoryService.findAllSuppliers(searchDto);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier ID', type: String })
  findSupplierById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findSupplierById(id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier ID', type: String })
  @ApiBody({ type: UpdateSupplierDto })
  updateSupplier(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateSupplierDto: UpdateSupplierDto
  ) {
    return this.inventoryService.updateSupplier(id, updateSupplierDto);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier ID', type: String })
  removeSupplier(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.removeSupplier(id);
  }

  // Inventory Item endpoints
  @Post('items')
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateInventoryItemDto })
  createInventoryItem(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(createInventoryItemDto);
  }

  @Get('items')
  @ApiOperation({ summary: 'Get all inventory items with filtering' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  @ApiQuery({ type: InventorySearchDto })
  findAllInventoryItems(@Query() searchDto: InventorySearchDto) {
    return this.inventoryService.findAllInventoryItems(searchDto);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: String })
  findInventoryItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findInventoryItemById(id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: String })
  @ApiBody({ type: UpdateInventoryItemDto })
  updateInventoryItem(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateInventoryItemDto: UpdateInventoryItemDto
  ) {
    return this.inventoryService.updateInventoryItem(id, updateInventoryItemDto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: String })
  removeInventoryItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.removeInventoryItem(id);
  }

  // Stock Transaction endpoints
  @Post('transactions')
  @ApiOperation({ summary: 'Create stock transaction' })
  @ApiResponse({ status: 201, description: 'Stock transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  @ApiBody({ type: CreateStockTransactionDto })
  createStockTransaction(@Body() createTransactionDto: CreateStockTransactionDto) {
    return this.inventoryService.createStockTransaction(createTransactionDto);
  }

  @Get('items/:id/transactions')
  @ApiOperation({ summary: 'Get stock transactions for inventory item' })
  @ApiResponse({ status: 200, description: 'Stock transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiParam({ name: 'id', description: 'Inventory item ID', type: String })
  @ApiQuery({ name: 'days', description: 'Number of days to look back', required: false, type: Number })
  getStockTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    return this.inventoryService.getStockTransactions(id, days);
  }

  // Stock Management endpoints
  @Post('adjust-stock')
  @ApiOperation({ summary: 'Adjust stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment data' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiBody({ type: StockAdjustmentDto })
  adjustStock(@Body() adjustmentDto: StockAdjustmentDto) {
    return this.inventoryService.adjustStock(adjustmentDto);
  }

  @Post('transfer-stock')
  @ApiOperation({ summary: 'Transfer stock between locations' })
  @ApiResponse({ status: 200, description: 'Stock transferred successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transfer data or insufficient stock' })
  @ApiBody({ type: StockTransferDto })
  transferStock(@Body() transferDto: StockTransferDto) {
    return this.inventoryService.transferStock(transferDto);
  }

  // Analytics and Reporting endpoints
  @Get('restaurant/:restaurantId/low-stock')
  @ApiOperation({ summary: 'Get low stock items for restaurant' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getLowStockItems(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getLowStockItems(restaurantId);
  }

  @Get('restaurant/:restaurantId/expiring')
  @ApiOperation({ summary: 'Get expiring items for restaurant' })
  @ApiResponse({ status: 200, description: 'Expiring items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'days', description: 'Days until expiration', required: false, type: Number })
  getExpiringItems(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.inventoryService.getExpiringItems(restaurantId, days);
  }

  @Get('restaurant/:restaurantId/value')
  @ApiOperation({ summary: 'Get total inventory value for restaurant' })
  @ApiResponse({ status: 200, description: 'Inventory value calculated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getInventoryValue(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getInventoryValue(restaurantId);
  }

  @Get('restaurant/:restaurantId/category-breakdown')
  @ApiOperation({ summary: 'Get inventory breakdown by category' })
  @ApiResponse({ status: 200, description: 'Category breakdown retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getCategoryBreakdown(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getCategoryBreakdown(restaurantId);
  }

  @Get('restaurant/:restaurantId/stock-movement')
  @ApiOperation({ summary: 'Get stock movement report' })
  @ApiResponse({ status: 200, description: 'Stock movement report generated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ name: 'days', description: 'Number of days to analyze', required: false, type: Number })
  getStockMovementReport(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    return this.inventoryService.getStockMovementReport(restaurantId, days);
  }

  @Get('restaurant/:restaurantId/reorder-items')
  @ApiOperation({ summary: 'Get items needing reorder' })
  @ApiResponse({ status: 200, description: 'Reorder items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getItemsNeedingReorder(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getItemsNeedingReorder(restaurantId);
  }
}