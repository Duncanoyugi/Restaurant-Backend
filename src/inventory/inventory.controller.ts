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

@Controller('inventory')
@UseInterceptors(ClassSerializerInterceptor)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Supplier endpoints
  @Post('suppliers')
  createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(createSupplierDto);
  }

  @Get('suppliers')
  findAllSuppliers(@Query() searchDto: SupplierSearchDto) {
    return this.inventoryService.findAllSuppliers(searchDto);
  }

  @Get('suppliers/:id')
  findSupplierById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findSupplierById(id);
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateSupplierDto: UpdateSupplierDto
  ) {
    return this.inventoryService.updateSupplier(id, updateSupplierDto);
  }

  @Delete('suppliers/:id')
  removeSupplier(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.removeSupplier(id);
  }

  // Inventory Item endpoints
  @Post('items')
  createInventoryItem(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(createInventoryItemDto);
  }

  @Get('items')
  findAllInventoryItems(@Query() searchDto: InventorySearchDto) {
    return this.inventoryService.findAllInventoryItems(searchDto);
  }

  @Get('items/:id')
  findInventoryItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findInventoryItemById(id);
  }

  @Patch('items/:id')
  updateInventoryItem(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateInventoryItemDto: UpdateInventoryItemDto
  ) {
    return this.inventoryService.updateInventoryItem(id, updateInventoryItemDto);
  }

  @Delete('items/:id')
  removeInventoryItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.removeInventoryItem(id);
  }

  // Stock Transaction endpoints
  @Post('transactions')
  createStockTransaction(@Body() createTransactionDto: CreateStockTransactionDto) {
    return this.inventoryService.createStockTransaction(createTransactionDto);
  }

  @Get('items/:id/transactions')
  getStockTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    return this.inventoryService.getStockTransactions(id, days);
  }

  // Stock Management endpoints
  @Post('adjust-stock')
  adjustStock(@Body() adjustmentDto: StockAdjustmentDto) {
    return this.inventoryService.adjustStock(adjustmentDto);
  }

  @Post('transfer-stock')
  transferStock(@Body() transferDto: StockTransferDto) {
    return this.inventoryService.transferStock(transferDto);
  }

  // Analytics and Reporting endpoints
  @Get('restaurant/:restaurantId/low-stock')
  getLowStockItems(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getLowStockItems(restaurantId);
  }

  @Get('restaurant/:restaurantId/expiring')
  getExpiringItems(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.inventoryService.getExpiringItems(restaurantId, days);
  }

  @Get('restaurant/:restaurantId/value')
  getInventoryValue(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getInventoryValue(restaurantId);
  }

  @Get('restaurant/:restaurantId/category-breakdown')
  getCategoryBreakdown(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getCategoryBreakdown(restaurantId);
  }

  @Get('restaurant/:restaurantId/stock-movement')
  getStockMovementReport(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    return this.inventoryService.getStockMovementReport(restaurantId, days);
  }

  @Get('restaurant/:restaurantId/reorder-items')
  getItemsNeedingReorder(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.inventoryService.getItemsNeedingReorder(restaurantId);
  }
}