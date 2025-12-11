// backend\src\inventory\inventory.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger
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
import { UserRoleEnum } from '../user/entities/user.types';
import { User } from '../user/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(StockTransaction)
    private stockTransactionRepository: Repository<StockTransaction>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  // ==================== ROLE VALIDATION METHODS ====================

  private async validateRestaurantAccess(user: User, restaurantId?: number): Promise<void> {
    if (user.role.name === UserRoleEnum.ADMIN) {
      return; // Admin has access to all restaurants
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const userRestaurantId = await this.getUserRestaurantId(user);
      if (!userRestaurantId) {
        throw new ForbiddenException('Restaurant association required');
      }
      if (restaurantId && userRestaurantId !== restaurantId) {
        throw new ForbiddenException('Access to this restaurant denied');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions for inventory access');
    }
  }

  private async getUserRestaurantId(user: User): Promise<number | null> {
    // For restaurant owners
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER && user.ownedRestaurants?.length > 0) {
      return user.ownedRestaurants[0].id;
    }

    // For restaurant staff
    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF && user.restaurantStaff) {
      return user.restaurantStaff.restaurantId;
    }

    return null;
  }

  private async getCurrentUserRestaurantId(user: User): Promise<number> {
    const restaurantId = await this.getUserRestaurantId(user);
    if (!restaurantId) {
      throw new ForbiddenException('You are not associated with any restaurant');
    }
    return restaurantId;
  }

  private enforceRestaurantFilter(user: User, searchDto: any): any {
    // Auto-filter by restaurant for restaurant owners and staff
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      return {
        ...searchDto,
        restaurantId: searchDto.restaurantId || this.getUserRestaurantId(user)
      };
    }
    return searchDto;
  }

  // ==================== SUPPLIER CRUD OPERATIONS ====================

  async createSupplier(createSupplierDto: CreateSupplierDto, user: User): Promise<Supplier> {
    // Only Admin and Restaurant Owners can create suppliers
    if (user.role.name !== UserRoleEnum.ADMIN && user.role.name !== UserRoleEnum.RESTAURANT_OWNER) {
      throw new ForbiddenException('Insufficient permissions to create suppliers');
    }

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

  async findAllSuppliers(searchDto: SupplierSearchDto, user: User): Promise<Supplier[]> {
    // Only Admin and Restaurant staff can view suppliers
    if (user.role.name !== UserRoleEnum.ADMIN && 
        user.role.name !== UserRoleEnum.RESTAURANT_OWNER && 
        user.role.name !== UserRoleEnum.RESTAURANT_STAFF) {
      throw new ForbiddenException('Insufficient permissions to view suppliers');
    }

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

  async findSupplierById(id: number, user: User): Promise<Supplier> {
    // Only Admin and Restaurant staff can view suppliers
    if (user.role.name !== UserRoleEnum.ADMIN && 
        user.role.name !== UserRoleEnum.RESTAURANT_OWNER && 
        user.role.name !== UserRoleEnum.RESTAURANT_STAFF) {
      throw new ForbiddenException('Insufficient permissions to view suppliers');
    }

    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: ['inventoryItems', 'inventoryItems.restaurant']
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async updateSupplier(id: number, updateSupplierDto: UpdateSupplierDto, user: User): Promise<Supplier> {
    // Only Admin and Restaurant Owners can update suppliers
    if (user.role.name !== UserRoleEnum.ADMIN && user.role.name !== UserRoleEnum.RESTAURANT_OWNER) {
      throw new ForbiddenException('Insufficient permissions to update suppliers');
    }

    const supplier = await this.findSupplierById(id, user);

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

  async removeSupplier(id: number, user: User): Promise<void> {
    // Only Admin and Restaurant Owners can delete suppliers
    if (user.role.name !== UserRoleEnum.ADMIN && user.role.name !== UserRoleEnum.RESTAURANT_OWNER) {
      throw new ForbiddenException('Insufficient permissions to delete suppliers');
    }

    const supplier = await this.findSupplierById(id, user);
    
    // Check if supplier has inventory items
    const inventoryItemsCount = await this.inventoryItemRepository.count({
      where: { supplierId: id }
    });

    if (inventoryItemsCount > 0) {
      throw new BadRequestException('Cannot delete supplier with existing inventory items');
    }

    await this.supplierRepository.remove(supplier);
  }

  // ==================== INVENTORY ITEM CRUD OPERATIONS ====================

  async createInventoryItem(createInventoryItemDto: CreateInventoryItemDto, user: User): Promise<InventoryItem> {
    // Validate restaurant access
    await this.validateRestaurantAccess(user, Number(createInventoryItemDto.restaurantId));

    // Check if SKU already exists in the same restaurant
    if (createInventoryItemDto.sku) {
      const existingItem = await this.inventoryItemRepository.findOne({
        where: {
          sku: createInventoryItemDto.sku,
          restaurantId: Number(createInventoryItemDto.restaurantId)
        }
      });

      if (existingItem) {
        throw new ConflictException('Inventory item with this SKU already exists in this restaurant');
      }
    }

    const inventoryItem = this.inventoryItemRepository.create({
      ...createInventoryItemDto,
      restaurantId: Number(createInventoryItemDto.restaurantId),
      supplierId: createInventoryItemDto.supplierId ? Number(createInventoryItemDto.supplierId) : undefined
    });
    const savedItem = await this.inventoryItemRepository.save(inventoryItem);

    // Create initial stock transaction
    if (savedItem.quantity > 0) {
      const initialTransaction = this.stockTransactionRepository.create({
        inventoryItemId: savedItem.id,
        quantityChange: savedItem.quantity,
        transactionType: TransactionType.IN,
        reason: 'Initial stock',
        referenceId: `INIT_${savedItem.id}`,
        performedBy: user.id
      });
      await this.stockTransactionRepository.save(initialTransaction);
    }

    return savedItem;
  }

  async findAllInventoryItems(searchDto: InventorySearchDto, user: User): Promise<{ data: InventoryItem[], total: number }> {
    // Enforce restaurant filter for non-admin users
    const filteredSearchDto = this.enforceRestaurantFilter(user, searchDto);
    
    const { 
      restaurantId, 
      supplierId, 
      category, 
      name, 
      lowStock,
      page = 1, 
      limit = 20 
    } = filteredSearchDto;
    
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

  async findInventoryItemById(id: number, user: User): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryItemRepository.findOne({
      where: { id: Number(id) },
      relations: [
        'supplier', 
        'restaurant', 
        'transactions'
      ],
    });

    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    // Validate restaurant access
    await this.validateRestaurantAccess(user, inventoryItem.restaurantId);

    return inventoryItem;
  }

  async updateInventoryItem(id: number, updateInventoryItemDto: UpdateInventoryItemDto, user: User): Promise<InventoryItem> {
    const inventoryItem = await this.findInventoryItemById(Number(id), user);

    // Check if SKU is being updated and if it already exists in the same restaurant
    if (updateInventoryItemDto.sku && updateInventoryItemDto.sku !== inventoryItem.sku) {
      const existingItem = await this.inventoryItemRepository.findOne({
        where: {
          sku: updateInventoryItemDto.sku,
          restaurantId: Number(updateInventoryItemDto.restaurantId) || inventoryItem.restaurantId
        }
      });

      if (existingItem) {
        throw new ConflictException('Inventory item with this SKU already exists in this restaurant');
      }
    }

    Object.assign(inventoryItem, updateInventoryItemDto);
    return await this.inventoryItemRepository.save(inventoryItem);
  }

  async removeInventoryItem(id: number, user: User): Promise<void> {
    // Only Admin and Restaurant Owners can delete inventory items
    if (user.role.name !== UserRoleEnum.ADMIN && user.role.name !== UserRoleEnum.RESTAURANT_OWNER) {
      throw new ForbiddenException('Insufficient permissions to delete inventory items');
    }

    const inventoryItem = await this.findInventoryItemById(id, user);
    await this.inventoryItemRepository.remove(inventoryItem);
  }

  // ==================== STOCK TRANSACTION OPERATIONS ====================

  async createStockTransaction(createTransactionDto: CreateStockTransactionDto, user: User): Promise<{ transaction: StockTransaction, inventoryItem: InventoryItem }> {
    const inventoryItem = await this.findInventoryItemById(Number(createTransactionDto.inventoryItemId), user);

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

    // Create stock transaction with user info
    const transactionData = {
      ...createTransactionDto,
      inventoryItemId: createTransactionDto.inventoryItemId,
      performedBy: user.id
    };

    const transaction = this.stockTransactionRepository.create(transactionData);
    const savedTransaction = await this.stockTransactionRepository.save(transaction);

    return { transaction: savedTransaction, inventoryItem };
  }

  async getStockTransactions(inventoryItemId: number, days: number = 30, user: User): Promise<StockTransaction[]> {
    const inventoryItem = await this.findInventoryItemById(Number(inventoryItemId), user);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.stockTransactionRepository.find({
      where: {
        inventoryItemId: Number(inventoryItemId),
        createdAt: MoreThan(startDate)
      },
      relations: ['inventoryItem'],
      order: { createdAt: 'DESC' }
    });
  }

  // ==================== STOCK MANAGEMENT OPERATIONS ====================

  async adjustStock(adjustmentDto: StockAdjustmentDto, user: User): Promise<{ transaction: StockTransaction, inventoryItem: InventoryItem }> {
    const inventoryItem = await this.findInventoryItemById(Number(adjustmentDto.inventoryItemId), user);

    const quantityChange = adjustmentDto.newQuantity - inventoryItem.quantity;

    const transactionDto: CreateStockTransactionDto = {
      inventoryItemId: adjustmentDto.inventoryItemId,
      quantityChange: Math.abs(quantityChange),
      transactionType: TransactionType.ADJUSTMENT,
      reason: adjustmentDto.reason,
      performedBy: user.id
    };

    return await this.createStockTransaction(transactionDto, user);
  }

  async transferStock(transferDto: StockTransferDto, user: User): Promise<{
    fromTransaction: StockTransaction,
    toTransaction: StockTransaction,
    fromItem: InventoryItem,
    toItem: InventoryItem
  }> {
    const fromItem = await this.findInventoryItemById(Number(transferDto.fromInventoryItemId), user);
    const toItem = await this.findInventoryItemById(Number(transferDto.toInventoryItemId), user);

    // Ensure both items belong to the same restaurant (for restaurant users)
    if (user.role.name !== UserRoleEnum.ADMIN && fromItem.restaurantId !== toItem.restaurantId) {
      throw new ForbiddenException('Cannot transfer stock between different restaurants');
    }

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
      performedBy: user.id,
      referenceId: `TRANSFER_TO_${toItem.id}`
    });

    // Create IN transaction for destination item
    const inTransaction = this.stockTransactionRepository.create({
      inventoryItemId: toItem.id,
      quantityChange: transferDto.quantity,
      transactionType: TransactionType.IN,
      reason: transferDto.reason || `Transfer from ${fromItem.name}`,
      performedBy: user.id,
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

  // ==================== ANALYTICS AND REPORTING ====================

  async getLowStockItems(restaurantId: number, user: User): Promise<InventoryItem[]> {
    await this.validateRestaurantAccess(user, Number(restaurantId));

    return await this.inventoryItemRepository
      .createQueryBuilder('item')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .andWhere('item.quantity <= item.threshold')
      .leftJoinAndSelect('item.supplier', 'supplier')
      .orderBy('item.quantity', 'ASC')
      .getMany();
  }

  async getExpiringItems(restaurantId: number, days: number = 7, user: User): Promise<InventoryItem[]> {
    await this.validateRestaurantAccess(user, Number(restaurantId));

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

  async getInventoryValue(restaurantId: number, user: User): Promise<{ totalValue: number, itemCount: number }> {
    await this.validateRestaurantAccess(user, Number(restaurantId));

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

  async getCategoryBreakdown(restaurantId: number, user: User): Promise<{ category: string, count: number, value: number }[]> {
    await this.validateRestaurantAccess(user, Number(restaurantId));

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

  async getStockMovementReport(restaurantId: number, days: number = 30, user: User): Promise<any> {
    await this.validateRestaurantAccess(user, Number(restaurantId));

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

  // ==================== RESTAURANT-SPECIFIC METHODS ====================

  async getMyRestaurantInventoryItems(searchDto: InventorySearchDto, user: User): Promise<{ data: InventoryItem[], total: number }> {
    const restaurantId = await this.getCurrentUserRestaurantId(user);
    
    const searchWithRestaurant = {
      ...searchDto,
      restaurantId
    };

    return this.findAllInventoryItems(searchWithRestaurant, user);
  }

  async getMyRestaurantLowStockItems(user: User): Promise<InventoryItem[]> {
    const restaurantId = await this.getCurrentUserRestaurantId(user);
    return this.getLowStockItems(restaurantId, user);
  }

  async getMyRestaurantInventoryAnalytics(user: User): Promise<any> {
    const restaurantId = await this.getCurrentUserRestaurantId(user);

    const [inventoryValue, lowStockItems, expiringItems, categoryBreakdown] = await Promise.all([
      this.getInventoryValue(restaurantId, user),
      this.getLowStockItems(restaurantId, user),
      this.getExpiringItems(restaurantId, 7, user),
      this.getCategoryBreakdown(restaurantId, user)
    ]);

    return {
      restaurantId,
      inventoryValue,
      lowStockCount: lowStockItems.length,
      expiringCount: expiringItems.length,
      categoryBreakdown,
      lastUpdated: new Date()
    };
  }

  // ==================== HELPER METHODS ====================

  async isItemLowStock(inventoryItemId: number, user: User): Promise<boolean> {
    const item = await this.findInventoryItemById(Number(inventoryItemId), user);
    return item.quantity <= item.threshold;
  }

  async getItemsNeedingReorder(restaurantId: number, user: User): Promise<InventoryItem[]> {
    return await this.getLowStockItems(Number(restaurantId), user);
  }
}