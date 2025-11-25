import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere, MoreThan, LessThanOrEqual } from 'typeorm';
import { InventoryItem } from './entities/inventory.entity';
import { Supplier } from './entities/supplier.entity';
import { StockTransaction, TransactionType } from './entities/stock-transaction.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { InventorySearchDto } from './dto/inventory-search.dto';
import { SupplierSearchDto } from './dto/supplier-search.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(StockTransaction)
    private stockTransactionRepository: Repository<StockTransaction>,
  ) {}

  // Supplier CRUD operations
  async createSupplier(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    // Check if supplier with same email or phone already exists
    const existingSupplier = await this.supplierRepository.findOne({
      where: [
        { email: createSupplierDto.email },
        { phone: createSupplierDto.phone }
      ]
    });

    if (existingSupplier) {
      throw new ConflictException('Supplier with this email or phone already exists');
    }

    const supplier = this.supplierRepository.create(createSupplierDto);
    return await this.supplierRepository.save(supplier);
  }

  async findAllSuppliers(searchDto: SupplierSearchDto): Promise<Supplier[]> {
    const { name, contactName, active } = searchDto;

    const where: FindOptionsWhere<Supplier> = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (contactName) {
      where.contactName = Like(`%${contactName}%`);
    }

    if (active !== undefined) {
      where.active = active;
    }

    return await this.supplierRepository.find({
      where,
      relations: ['inventoryItems'],
      order: { name: 'ASC', createdAt: 'DESC' }
    });
  }

  async findSupplierById(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: ['inventoryItems', 'inventoryItems.restaurant']
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findSupplierById(id);

    // Check if email or phone is being updated and if they already exist
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: { email: updateSupplierDto.email }
      });

      if (existingSupplier) {
        throw new ConflictException('Supplier with this email already exists');
      }
    }

    if (updateSupplierDto.phone && updateSupplierDto.phone !== supplier.phone) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: { phone: updateSupplierDto.phone }
      });

      if (existingSupplier) {
        throw new ConflictException('Supplier with this phone already exists');
      }
    }

    Object.assign(supplier, updateSupplierDto);
    return await this.supplierRepository.save(supplier);
  }

  async removeSupplier(id: string): Promise<void> {
    const supplier = await this.findSupplierById(id);
    
    // Check if supplier has inventory items
    const inventoryItemsCount = await this.inventoryItemRepository.count({
      where: { supplierId: id }
    });

    if (inventoryItemsCount > 0) {
      throw new BadRequestException('Cannot delete supplier with existing inventory items');
    }

    await this.supplierRepository.remove(supplier);
  }

  // Inventory Item CRUD operations
  async createInventoryItem(createInventoryItemDto: CreateInventoryItemDto): Promise<InventoryItem> {
    // Check if SKU already exists in the same restaurant
    if (createInventoryItemDto.sku) {
      const existingItem = await this.inventoryItemRepository.findOne({
        where: { 
          sku: createInventoryItemDto.sku,
          restaurantId: createInventoryItemDto.restaurantId
        }
      });

      if (existingItem) {
        throw new ConflictException('Inventory item with this SKU already exists in this restaurant');
      }
    }

    const inventoryItem = this.inventoryItemRepository.create(createInventoryItemDto);
    const savedItem = await this.inventoryItemRepository.save(inventoryItem);

    // Create initial stock transaction
    if (savedItem.quantity > 0) {
      const initialTransaction = this.stockTransactionRepository.create({
        inventoryItemId: savedItem.id,
        quantityChange: savedItem.quantity,
        transactionType: TransactionType.IN,
        reason: 'Initial stock',
        referenceId: `INIT_${savedItem.id}`
      });
      await this.stockTransactionRepository.save(initialTransaction);
    }

    return savedItem;
  }

  async findAllInventoryItems(searchDto: InventorySearchDto): Promise<{ data: InventoryItem[], total: number }> {
    const { 
      restaurantId, 
      supplierId, 
      category, 
      name, 
      lowStock,
      page = 1, 
      limit = 20 
    } = searchDto;
    
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<InventoryItem> = { restaurantId };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (category) {
      where.category = Like(`%${category}%`);
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (lowStock) {
      where.quantity = LessThanOrEqual(where.threshold || 10);
    }

    const [data, total] = await this.inventoryItemRepository.findAndCount({
      where,
      relations: ['supplier', 'restaurant', 'transactions'],
      skip,
      take: limit,
      order: { 
        category: 'ASC',
        name: 'ASC'
      }
    });

    return { data, total };
  }

  async findInventoryItemById(id: string): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryItemRepository.findOne({
      where: { id },
      relations: [
        'supplier', 
        'restaurant', 
        'transactions'
      ],
    });

    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return inventoryItem;
  }

  async updateInventoryItem(id: string, updateInventoryItemDto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const inventoryItem = await this.findInventoryItemById(id);

    // Check if SKU is being updated and if it already exists in the same restaurant
    if (updateInventoryItemDto.sku && updateInventoryItemDto.sku !== inventoryItem.sku) {
      const existingItem = await this.inventoryItemRepository.findOne({
        where: { 
          sku: updateInventoryItemDto.sku,
          restaurantId: updateInventoryItemDto.restaurantId || inventoryItem.restaurantId
        }
      });

      if (existingItem) {
        throw new ConflictException('Inventory item with this SKU already exists in this restaurant');
      }
    }

    Object.assign(inventoryItem, updateInventoryItemDto);
    return await this.inventoryItemRepository.save(inventoryItem);
  }

  async removeInventoryItem(id: string): Promise<void> {
    const inventoryItem = await this.findInventoryItemById(id);
    await this.inventoryItemRepository.remove(inventoryItem);
  }

  // Stock Transaction operations
  async createStockTransaction(createTransactionDto: CreateStockTransactionDto): Promise<{ transaction: StockTransaction, inventoryItem: InventoryItem }> {
    const inventoryItem = await this.findInventoryItemById(createTransactionDto.inventoryItemId);

    // Update inventory quantity based on transaction type
    let newQuantity = inventoryItem.quantity;
    
    if (createTransactionDto.transactionType === TransactionType.IN) {
      newQuantity += createTransactionDto.quantityChange;
    } else if (createTransactionDto.transactionType === TransactionType.OUT) {
      if (inventoryItem.quantity < createTransactionDto.quantityChange) {
        throw new BadRequestException('Insufficient stock for this transaction');
      }
      newQuantity -= createTransactionDto.quantityChange;
    } else if (createTransactionDto.transactionType === TransactionType.ADJUSTMENT) {
      newQuantity = createTransactionDto.quantityChange;
    }

    // Update inventory item quantity
    inventoryItem.quantity = newQuantity;
    await this.inventoryItemRepository.save(inventoryItem);

    // Create stock transaction
    const transaction = this.stockTransactionRepository.create(createTransactionDto);
    const savedTransaction = await this.stockTransactionRepository.save(transaction);

    return { transaction: savedTransaction, inventoryItem };
  }

  async getStockTransactions(inventoryItemId: string, days: number = 30): Promise<StockTransaction[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.stockTransactionRepository.find({
      where: { 
        inventoryItemId,
        createdAt: MoreThan(startDate)
      },
      relations: ['inventoryItem'],
      order: { createdAt: 'DESC' }
    });
  }

  // Stock management operations
  async adjustStock(adjustmentDto: StockAdjustmentDto): Promise<{ transaction: StockTransaction, inventoryItem: InventoryItem }> {
    const inventoryItem = await this.findInventoryItemById(adjustmentDto.inventoryItemId);

    const quantityChange = adjustmentDto.newQuantity - inventoryItem.quantity;

    const transactionDto: CreateStockTransactionDto = {
      inventoryItemId: adjustmentDto.inventoryItemId,
      quantityChange: Math.abs(quantityChange),
      transactionType: TransactionType.ADJUSTMENT,
      reason: adjustmentDto.reason,
      performedBy: adjustmentDto.performedBy
    };

    return await this.createStockTransaction(transactionDto);
  }

  async transferStock(transferDto: StockTransferDto): Promise<{ 
    fromTransaction: StockTransaction, 
    toTransaction: StockTransaction,
    fromItem: InventoryItem,
    toItem: InventoryItem
  }> {
    const fromItem = await this.findInventoryItemById(transferDto.fromInventoryItemId);
    const toItem = await this.findInventoryItemById(transferDto.toInventoryItemId);

    // Check if source has sufficient stock
    if (fromItem.quantity < transferDto.quantity) {
      throw new BadRequestException('Insufficient stock in source item for transfer');
    }

    // Create OUT transaction for source item
    const outTransaction = this.stockTransactionRepository.create({
      inventoryItemId: fromItem.id,
      quantityChange: transferDto.quantity,
      transactionType: TransactionType.OUT,
      reason: transferDto.reason || `Transfer to ${toItem.name}`,
      performedBy: transferDto.performedBy,
      referenceId: `TRANSFER_TO_${toItem.id}`
    });

    // Create IN transaction for destination item
    const inTransaction = this.stockTransactionRepository.create({
      inventoryItemId: toItem.id,
      quantityChange: transferDto.quantity,
      transactionType: TransactionType.IN,
      reason: transferDto.reason || `Transfer from ${fromItem.name}`,
      performedBy: transferDto.performedBy,
      referenceId: `TRANSFER_FROM_${fromItem.id}`
    });

    // Update quantities
    fromItem.quantity -= transferDto.quantity;
    toItem.quantity += transferDto.quantity;

    // Save everything in a transaction
    const [savedOutTransaction, savedInTransaction] = await Promise.all([
      this.stockTransactionRepository.save(outTransaction),
      this.stockTransactionRepository.save(inTransaction),
      this.inventoryItemRepository.save(fromItem),
      this.inventoryItemRepository.save(toItem)
    ]);

    return {
      fromTransaction: savedOutTransaction,
      toTransaction: savedInTransaction,
      fromItem,
      toItem
    };
  }

  // Analytics and reporting
  async getLowStockItems(restaurantId: string): Promise<InventoryItem[]> {
    return await this.inventoryItemRepository
      .createQueryBuilder('item')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .andWhere('item.quantity <= item.threshold')
      .leftJoinAndSelect('item.supplier', 'supplier')
      .orderBy('item.quantity', 'ASC')
      .getMany();
  }

  async getExpiringItems(restaurantId: string, days: number = 7): Promise<InventoryItem[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await this.inventoryItemRepository
      .createQueryBuilder('item')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .andWhere('item.expiryDate IS NOT NULL')
      .andWhere('item.expiryDate <= :expiryDate', { expiryDate })
      .leftJoinAndSelect('item.supplier', 'supplier')
      .orderBy('item.expiryDate', 'ASC')
      .getMany();
  }

  async getInventoryValue(restaurantId: string): Promise<{ totalValue: number, itemCount: number }> {
    const result = await this.inventoryItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.quantity * item.unitPrice)', 'totalValue')
      .addSelect('COUNT(item.id)', 'itemCount')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    return {
      totalValue: parseFloat(result.totalValue) || 0,
      itemCount: parseInt(result.itemCount) || 0
    };
  }

  async getCategoryBreakdown(restaurantId: string): Promise<{ category: string, count: number, value: number }[]> {
    const results = await this.inventoryItemRepository
      .createQueryBuilder('item')
      .select('item.category', 'category')
      .addSelect('COUNT(item.id)', 'count')
      .addSelect('SUM(item.quantity * item.unitPrice)', 'value')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .groupBy('item.category')
      .orderBy('value', 'DESC')
      .getRawMany();

    return results.map(result => ({
      category: result.category,
      count: parseInt(result.count),
      value: parseFloat(result.value)
    }));
  }

  async getStockMovementReport(restaurantId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.stockTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.inventoryItem', 'item')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .andWhere('transaction.createdAt >= :startDate', { startDate })
      .select(['transaction.transactionType', 'transaction.quantityChange', 'item.category'])
      .getMany();

    const report = {
      totalIn: 0,
      totalOut: 0,
      totalAdjustments: 0,
      byCategory: {} as Record<string, { in: number, out: number, adjustments: number }>
    };

    transactions.forEach(transaction => {
      const category = transaction.inventoryItem.category;
      
      if (!report.byCategory[category]) {
        report.byCategory[category] = { in: 0, out: 0, adjustments: 0 };
      }

      if (transaction.transactionType === TransactionType.IN) {
        report.totalIn += transaction.quantityChange;
        report.byCategory[category].in += transaction.quantityChange;
      } else if (transaction.transactionType === TransactionType.OUT) {
        report.totalOut += transaction.quantityChange;
        report.byCategory[category].out += transaction.quantityChange;
      } else if (transaction.transactionType === TransactionType.ADJUSTMENT) {
        report.totalAdjustments += Math.abs(transaction.quantityChange);
        report.byCategory[category].adjustments += Math.abs(transaction.quantityChange);
      }
    });

    return report;
  }

  // Helper methods
  async isItemLowStock(inventoryItemId: string): Promise<boolean> {
    const item = await this.findInventoryItemById(inventoryItemId);
    return item.quantity <= item.threshold;
  }

  async getItemsNeedingReorder(restaurantId: string): Promise<InventoryItem[]> {
    return await this.getLowStockItems(restaurantId);
  }
}