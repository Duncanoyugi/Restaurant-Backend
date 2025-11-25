import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order, OrderType } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.entity';
import { StatusCatalog } from './entities/status-catalog.entity';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatusDto } from './dto/order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { OrderSearchDto } from './dto/order-search.dto';
import { KitchenOrderSearchDto } from './dto/kitchen-order.dto';
import { DeliveryOrderSearchDto } from './dto/delivery-order.dto';
import { OrderStatsDto } from './dto/order-stats.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatus)
    private orderStatusRepository: Repository<OrderStatus>,
    @InjectRepository(StatusCatalog)
    private statusCatalogRepository: Repository<StatusCatalog>,
  ) {}

  // Order CRUD operations
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate order type requirements
    this.validateOrderTypeRequirements(createOrderDto);

    // Calculate prices
    const priceCalculation = await this.calculateOrderPrices(createOrderDto);

    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Get initial status (Pending)
    const pendingStatus = await this.statusCatalogRepository.findOne({
      where: { name: 'Pending' }
    });

    if (!pendingStatus) {
      throw new NotFoundException('Pending status not found in status catalog');
    }

    // Create order data with proper typing - only include fields that are provided
    const orderData: Partial<Order> = {
      orderNumber,
      restaurantId: createOrderDto.restaurantId,
      userId: createOrderDto.userId,
      orderType: createOrderDto.orderType,
      statusId: pendingStatus.id,
      discount: createOrderDto.discount || 0,
      deliveryFee: createOrderDto.deliveryFee || 0,
      taxAmount: createOrderDto.taxAmount || 0,
      totalPrice: priceCalculation.totalPrice,
      finalPrice: priceCalculation.finalPrice,
    };

    // Only add optional fields if they are provided
    if (createOrderDto.tableId) {
      orderData.tableId = createOrderDto.tableId;
    }
    if (createOrderDto.deliveryAddressId) {
      orderData.deliveryAddressId = createOrderDto.deliveryAddressId;
    }
    if (createOrderDto.comment) {
      orderData.comment = createOrderDto.comment;
    }
    if (createOrderDto.scheduledTime) {
      orderData.scheduledTime = new Date(createOrderDto.scheduledTime);
    }

    const order = this.orderRepository.create(orderData);
    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = createOrderDto.items.map(item => {
      const itemPrice = priceCalculation.itemPrices.find(p => p.menuItemId === item.menuItemId);
      return this.orderItemRepository.create({
        orderId: savedOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        comment: item.comment,
        unitPrice: itemPrice?.unitPrice || 0,
        totalPrice: itemPrice?.totalPrice || 0
      });
    });

    await this.orderItemRepository.save(orderItems);

    // Create initial status history
    const initialStatus = this.orderStatusRepository.create({
      orderId: savedOrder.id,
      statusCatalogId: pendingStatus.id,
      notes: 'Order created'
    });

    await this.orderStatusRepository.save(initialStatus);

    return await this.findOrderById(savedOrder.id);
  }

  async findAllOrders(searchDto: OrderSearchDto): Promise<{ data: Order[], total: number }> {
    const { 
      restaurantId, 
      userId, 
      driverId,
      statusId,
      orderType,
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = searchDto;
    
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Order> = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (statusId) {
      where.statusId = statusId;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: [
        'restaurant', 
        'user', 
        'driver', 
        'table', 
        'deliveryAddress',
        'status',
        'orderItems',
        'orderItems.menuItem',
        'statusHistory',
        'statusHistory.statusCatalog'
      ],
      skip,
      take: limit,
      order: { 
        createdAt: 'DESC'
      }
    });

    return { data, total };
  }

  async findOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'restaurant', 
        'user', 
        'driver', 
        'table', 
        'deliveryAddress',
        'status',
        'orderItems',
        'orderItems.menuItem',
        'statusHistory',
        'statusHistory.statusCatalog',
        'payment',
        'deliveryTracking'
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: [
        'restaurant', 
        'user', 
        'driver', 
        'table', 
        'deliveryAddress',
        'status',
        'orderItems',
        'orderItems.menuItem',
        'statusHistory',
        'statusHistory.statusCatalog'
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOrderById(id);

    // Prevent updates for completed or cancelled orders
    const currentStatus = await this.statusCatalogRepository.findOne({
      where: { id: order.statusId }
    });

    if (['Completed', 'Cancelled'].includes(currentStatus?.name || '')) {
      throw new BadRequestException('Cannot update completed or cancelled order');
    }

    // Validate order type requirements if changing order type
    if (updateOrderDto.orderType) {
      this.validateOrderTypeRequirements({ 
        ...updateOrderDto, 
        items: updateOrderDto.items || order.orderItems 
      });
    }

    // Recalculate prices if items are being updated
    let priceUpdates: any = {};
    if (updateOrderDto.items) {
      const priceCalculation = await this.calculateOrderPrices({
        ...updateOrderDto,
        restaurantId: order.restaurantId,
        userId: order.userId,
        orderType: updateOrderDto.orderType || order.orderType,
        items: updateOrderDto.items
      } as CreateOrderDto);
      priceUpdates = priceCalculation;
    }

    // Update fields explicitly - only update if provided and use proper values
    if (updateOrderDto.tableId !== undefined) {
      order.tableId = updateOrderDto.tableId;
    }
    if (updateOrderDto.deliveryAddressId !== undefined) {
      order.deliveryAddressId = updateOrderDto.deliveryAddressId;
    }
    if (updateOrderDto.orderType !== undefined) order.orderType = updateOrderDto.orderType;
    if (updateOrderDto.discount !== undefined) order.discount = updateOrderDto.discount || 0;
    if (updateOrderDto.deliveryFee !== undefined) order.deliveryFee = updateOrderDto.deliveryFee || 0;
    if (updateOrderDto.taxAmount !== undefined) order.taxAmount = updateOrderDto.taxAmount || 0;
    if (updateOrderDto.comment !== undefined) {
      order.comment = updateOrderDto.comment;
    }
    
    if (updateOrderDto.scheduledTime !== undefined) {
      if (updateOrderDto.scheduledTime) {
        order.scheduledTime = new Date(updateOrderDto.scheduledTime);
      }
    }

    // Apply price updates if available
    if (priceUpdates.totalPrice !== undefined) order.totalPrice = priceUpdates.totalPrice;
    if (priceUpdates.finalPrice !== undefined) order.finalPrice = priceUpdates.finalPrice;

    const updatedOrder = await this.orderRepository.save(order);

    // Update order items if provided
    if (updateOrderDto.items) {
      // Remove existing items
      await this.orderItemRepository.delete({ orderId: id });

      // Create new items
      const orderItems = updateOrderDto.items.map(item => {
        const itemPrice = priceUpdates.itemPrices?.find((p: any) => p.menuItemId === item.menuItemId);
        return this.orderItemRepository.create({
          orderId: id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          comment: item.comment,
          unitPrice: itemPrice?.unitPrice || 0,
          totalPrice: itemPrice?.totalPrice || 0
        });
      });

      await this.orderItemRepository.save(orderItems);
    }

    return await this.findOrderById(id);
  }

  async removeOrder(id: string): Promise<void> {
    const order = await this.findOrderById(id);

    // Only allow deletion for pending orders
    const currentStatus = await this.statusCatalogRepository.findOne({
      where: { id: order.statusId }
    });

    if (currentStatus?.name !== 'Pending') {
      throw new BadRequestException('Can only delete orders with Pending status');
    }

    await this.orderRepository.softRemove(order);
  }

  // Order Status operations
  async updateOrderStatus(id: string, statusDto: OrderStatusDto): Promise<Order> {
    const order = await this.findOrderById(id);

    // Verify the status exists
    const newStatus = await this.statusCatalogRepository.findOne({
      where: { id: statusDto.statusId }
    });

    if (!newStatus) {
      throw new NotFoundException('Status not found');
    }

    // Validate status transition
    await this.validateStatusTransition(order.statusId, statusDto.statusId);

    // Update order status
    order.statusId = statusDto.statusId;
    await this.orderRepository.save(order);

    // Add to status history
    const statusHistory = this.orderStatusRepository.create({
      orderId: id,
      statusCatalogId: statusDto.statusId,
      notes: statusDto.notes,
      updatedBy: statusDto.updatedBy
    });

    await this.orderStatusRepository.save(statusHistory);

    // Handle status-specific actions
    await this.handleStatusChangeActions(id, newStatus.name);

    return await this.findOrderById(id);
  }

  async getOrderStatusHistory(orderId: string): Promise<OrderStatus[]> {
    const order = await this.findOrderById(orderId);
    return order.statusHistory.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // Driver operations
  async assignDriver(orderId: string, assignDriverDto: AssignDriverDto): Promise<Order> {
    const order = await this.findOrderById(orderId);

    // Only assign driver for delivery orders
    if (order.orderType !== OrderType.DELIVERY) {
      throw new BadRequestException('Can only assign driver to delivery orders');
    }

    // Check if order is in a state that can accept driver assignment
    const currentStatus = await this.statusCatalogRepository.findOne({
      where: { id: order.statusId }
    });

    if (!['Preparing', 'Ready'].includes(currentStatus?.name || '')) {
      throw new BadRequestException('Can only assign driver to orders that are Preparing or Ready');
    }

    order.driverId = assignDriverDto.driverId;
    await this.orderRepository.save(order);

    // Update status to "Out for Delivery"
    const outForDeliveryStatus = await this.statusCatalogRepository.findOne({
      where: { name: 'Out for Delivery' }
    });

    if (outForDeliveryStatus) {
      await this.updateOrderStatus(orderId, {
        statusId: outForDeliveryStatus.id,
        notes: `Driver ${assignDriverDto.driverId} assigned`
      });
    }

    return await this.findOrderById(orderId);
  }

  // Specialized queries
  async findKitchenOrders(searchDto: KitchenOrderSearchDto): Promise<Order[]> {
    const { restaurantId, statusId, date } = searchDto;

    const where: FindOptionsWhere<Order> = {
      restaurantId,
      orderType: In([OrderType.DINE_IN, OrderType.TAKEAWAY, OrderType.DELIVERY])
    };

    if (statusId) {
      where.statusId = statusId;
    } else {
      // Default to orders that need kitchen attention
      const kitchenStatuses = await this.statusCatalogRepository.find({
        where: { name: In(['Pending', 'Preparing']) }
      });
      where.statusId = In(kitchenStatuses.map(s => s.id));
    }

    if (date) {
      const targetDate = new Date(date);
      where.createdAt = Between(
        new Date(targetDate.setHours(0, 0, 0, 0)),
        new Date(targetDate.setHours(23, 59, 59, 999))
      );
    }

    return await this.orderRepository.find({
      where,
      relations: [
        'restaurant',
        'user',
        'table',
        'orderItems',
        'orderItems.menuItem',
        'status'
      ],
      order: { 
        createdAt: 'ASC'
      }
    });
  }

  async findDeliveryOrders(searchDto: DeliveryOrderSearchDto): Promise<Order[]> {
    const { restaurantId, driverId, statusId } = searchDto;

    const where: FindOptionsWhere<Order> = {
      orderType: OrderType.DELIVERY
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (statusId) {
      where.statusId = statusId;
    } else {
      // Default to orders that need delivery attention
      const deliveryStatuses = await this.statusCatalogRepository.find({
        where: { name: In(['Ready', 'Out for Delivery']) }
      });
      where.statusId = In(deliveryStatuses.map(s => s.id));
    }

    return await this.orderRepository.find({
      where,
      relations: [
        'restaurant',
        'user',
        'driver',
        'deliveryAddress',
        'orderItems',
        'orderItems.menuItem',
        'status'
      ],
      order: { 
        createdAt: 'ASC'
      }
    });
  }

  // Analytics and Reporting
  async getOrderStatistics(statsDto: OrderStatsDto): Promise<any> {
    const { restaurantId, startDate, endDate } = statsDto;

    const where: FindOptionsWhere<Order> = {
      createdAt: Between(new Date(startDate), new Date(endDate))
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const orders = await this.orderRepository.find({
      where,
      relations: ['status', 'orderItems']
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.finalPrice.toString()), 0);
    
    const statusCounts = await this.orderRepository
      .createQueryBuilder('order')
      .select('status.name', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .leftJoin('order.status', 'status')
      .where(where)
      .groupBy('status.name')
      .getRawMany();

    const orderTypeCounts = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderType', 'orderType')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.finalPrice)', 'revenue')
      .where(where)
      .groupBy('order.orderType')
      .getRawMany();

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusCounts,
      orderTypeCounts,
      period: {
        startDate,
        endDate
      }
    };
  }

  async getRestaurantOrdersToday(restaurantId: string): Promise<{ count: number, revenue: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'count')
      .addSelect('SUM(order.finalPrice)', 'revenue')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .andWhere('order.createdAt BETWEEN :start AND :end', {
        start: today,
        end: tomorrow
      })
      .getRawOne();

    return {
      count: parseInt(result.count) || 0,
      revenue: parseFloat(result.revenue) || 0
    };
  }

  // Helper methods
  private validateOrderTypeRequirements(orderData: CreateOrderDto | UpdateOrderDto): void {
    if (orderData.orderType === OrderType.DINE_IN && !orderData.tableId) {
      throw new BadRequestException('Table ID is required for dine-in orders');
    }

    if (orderData.orderType === OrderType.DELIVERY && !orderData.deliveryAddressId) {
      throw new BadRequestException('Delivery address is required for delivery orders');
    }
  }

  private async calculateOrderPrices(orderData: CreateOrderDto): Promise<{
    totalPrice: number;
    finalPrice: number;
    itemPrices: Array<{ menuItemId: string; unitPrice: number; totalPrice: number }>;
  }> {
    // This would typically fetch menu item prices from the database
    // For now, we'll use mock prices - in production, you'd query the menu items
    const itemPrices = await Promise.all(
      orderData.items.map(async (item) => {
        // In production, you'd fetch the actual price from the menu item
        const unitPrice = 10; // Mock price - replace with actual database query
        const totalPrice = unitPrice * item.quantity;
        
        return {
          menuItemId: item.menuItemId,
          unitPrice,
          totalPrice
        };
      })
    );

    const totalPrice = itemPrices.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = orderData.discount || 0;
    const deliveryFee = orderData.deliveryFee || 0;
    const taxAmount = orderData.taxAmount || 0;

    const finalPrice = totalPrice - discount + deliveryFee + taxAmount;

    return {
      totalPrice,
      finalPrice,
      itemPrices
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  private async validateStatusTransition(currentStatusId: string, newStatusId: string): Promise<void> {
    // Get current and new status names
    const [currentStatus, newStatus] = await Promise.all([
      this.statusCatalogRepository.findOne({ where: { id: currentStatusId } }),
      this.statusCatalogRepository.findOne({ where: { id: newStatusId } })
    ]);

    if (!currentStatus || !newStatus) {
      throw new NotFoundException('Status not found');
    }

    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'Pending': ['Preparing', 'Cancelled'],
      'Preparing': ['Ready', 'Cancelled'],
      'Ready': ['Out for Delivery', 'Completed', 'Cancelled'],
      'Out for Delivery': ['Delivered', 'Cancelled'],
      'Delivered': ['Completed'],
      'Completed': [],
      'Cancelled': []
    };

    const allowedNextStatuses = validTransitions[currentStatus.name] || [];
    if (!allowedNextStatuses.includes(newStatus.name)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus.name} to ${newStatus.name}`);
    }
  }

  private async handleStatusChangeActions(orderId: string, newStatusName: string): Promise<void> {
    switch (newStatusName) {
      case 'Ready':
        // Notify available drivers
        await this.notifyDrivers(orderId);
        break;
      case 'Out for Delivery':
        // Start delivery tracking
        await this.startDeliveryTracking(orderId);
        break;
      case 'Delivered':
        // Record delivery time
        await this.recordDeliveryTime(orderId);
        break;
      case 'Completed':
        // Process completion tasks
        await this.processOrderCompletion(orderId);
        break;
    }
  }

  private async notifyDrivers(orderId: string): Promise<void> {
    // Implementation for notifying drivers
    console.log(`Notifying drivers for order ${orderId}`);
  }

  private async startDeliveryTracking(orderId: string): Promise<void> {
    // Implementation for starting delivery tracking
    console.log(`Starting delivery tracking for order ${orderId}`);
  }

  private async recordDeliveryTime(orderId: string): Promise<void> {
    const order = await this.findOrderById(orderId);
    order.actualDeliveryTime = new Date();
    await this.orderRepository.save(order);
  }

  private async processOrderCompletion(orderId: string): Promise<void> {
    // Implementation for order completion processing
    console.log(`Processing completion for order ${orderId}`);
  }
}