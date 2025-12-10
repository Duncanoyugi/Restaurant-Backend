// backend\src\order\order.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException
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
import { User } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/entities/user.types';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantService } from '../restaurant/restaurant.service';

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
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private restaurantService: RestaurantService,
  ) { }

  // Helper method to check order access
  private async checkOrderAccess(user: User, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'restaurant.owner', 'restaurant.staff', 'restaurant.staff.user']
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Admin has access to all orders
    if (user.role.name === UserRoleEnum.ADMIN) {
      return order;
    }

    // Customers can only access their own orders
    if (user.role.name === UserRoleEnum.CUSTOMER && order.userId !== user.id) {
      throw new ForbiddenException('You can only access your own orders');
    }

    // Drivers can only access orders assigned to them
    if (user.role.name === UserRoleEnum.DRIVER && order.driverId !== user.id) {
      throw new ForbiddenException('You can only access orders assigned to you');
    }

    // Restaurant owners and staff can only access orders from their restaurant
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const hasAccess = await this.checkRestaurantAccess(user, order.restaurantId);
      if (!hasAccess) {
        throw new ForbiddenException('You can only access orders from your restaurant');
      }
    }

    return order;
  }

  // Helper method to check restaurant access
  private async checkRestaurantAccess(user: User, restaurantId: string): Promise<boolean> {
    if (user.role.name === UserRoleEnum.ADMIN) {
      return true;
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['owner', 'staff', 'staff.user']
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER && restaurant.owner.id === user.id) {
      return true;
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const isStaff = restaurant.staff.some(staff => staff.user.id === user.id);
      return isStaff;
    }

    return false;
  }

  // Helper method to get user's restaurant ID
  private async getUserRestaurantId(user: User): Promise<string> {
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { owner: { id: user.id } }
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found for this user');
      }

      return restaurant.id;
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const staffRecord = await this.restaurantRepository
        .createQueryBuilder('restaurant')
        .innerJoin('restaurant.staff', 'staff')
        .where('staff.userId = :userId', { userId: user.id })
        .getOne();

      if (!staffRecord) {
        throw new ForbiddenException('You are not assigned to any restaurant');
      }

      return staffRecord.id;
    }

    throw new ForbiddenException('User does not have restaurant access');
  }

  // Order CRUD operations
  async createOrder(createOrderDto: CreateOrderDto, user?: User): Promise<Order> {
    // Customers can only create orders for themselves
    if (user && user.role.name === UserRoleEnum.CUSTOMER && createOrderDto.userId !== user.id) {
      throw new ForbiddenException('You can only create orders for yourself');
    }

    // Auto-inject default restaurant ID if not provided
    if (!createOrderDto.restaurantId) {
      const defaultRestaurant = await this.restaurantService.getDefaultRestaurant();
      createOrderDto.restaurantId = defaultRestaurant.id;
    }

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

    return await this.findOrderById(savedOrder.id, user);
  }

  async findAllOrders(searchDto: OrderSearchDto, user?: User): Promise<{ data: Order[], total: number }> {
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

    // Apply role-based filtering
    if (user) {
      if (user.role.name === UserRoleEnum.CUSTOMER) {
        where.userId = user.id; // Customers can only see their own orders
      } else if (user.role.name === UserRoleEnum.DRIVER) {
        where.driverId = user.id; // Drivers can only see orders assigned to them
      } else if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
        const restaurantId = await this.getUserRestaurantId(user);
        where.restaurantId = restaurantId; // Restaurant users can only see their restaurant's orders
      }
      // Admin can see all orders (no additional filtering)
    }

    // Apply search filters (overriding role-based filters for admin)
    if (restaurantId && (user?.role.name === UserRoleEnum.ADMIN || await this.checkRestaurantAccess(user!, restaurantId))) {
      where.restaurantId = restaurantId;
    }

    if (userId && (user?.role.name === UserRoleEnum.ADMIN || user?.id === userId)) {
      where.userId = userId;
    }

    if (driverId && (user?.role.name === UserRoleEnum.ADMIN || user?.id === driverId)) {
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

  async findOrderById(id: string, user?: User): Promise<Order> {
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

    // Check access permissions
    if (user) {
      await this.checkOrderAccess(user, id);
    }

    return order;
  }

  async findOrderByNumber(orderNumber: string, user?: User): Promise<Order> {
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

    // Check access permissions
    if (user) {
      await this.checkOrderAccess(user, order.id);
    }

    return order;
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto, user?: User): Promise<Order> {
    const order = await this.findOrderById(id, user);

    // Check if user can update this order
    if (user) {
      if (user.role.name === UserRoleEnum.CUSTOMER && order.userId !== user.id) {
        throw new ForbiddenException('You can only update your own orders');
      }

      if ((user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
        const hasAccess = await this.checkRestaurantAccess(user, order.restaurantId);
        if (!hasAccess) {
          throw new ForbiddenException('You can only update orders from your restaurant');
        }
      }
    }

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

    return await this.findOrderById(id, user);
  }

  async removeOrder(id: string, user?: User): Promise<void> {
    const order = await this.findOrderById(id, user);

    // Check if user can delete this order
    if (user) {
      if (user.role.name === UserRoleEnum.CUSTOMER && order.userId !== user.id) {
        throw new ForbiddenException('You can only delete your own orders');
      }

      if ((user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
        const hasAccess = await this.checkRestaurantAccess(user, order.restaurantId);
        if (!hasAccess) {
          throw new ForbiddenException('You can only delete orders from your restaurant');
        }
      }
    }

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
  async updateOrderStatus(id: string, statusDto: OrderStatusDto, user?: User): Promise<Order> {
    const order = await this.findOrderById(id, user);

    // Check if user can update order status
    if (user) {
      if (user.role.name === UserRoleEnum.DRIVER && order.driverId !== user.id) {
        throw new ForbiddenException('You can only update status for orders assigned to you');
      }

      if ((user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
        const hasAccess = await this.checkRestaurantAccess(user, order.restaurantId);
        if (!hasAccess) {
          throw new ForbiddenException('You can only update status for orders from your restaurant');
        }
      }
    }

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
      updatedBy: statusDto.updatedBy || user?.id
    });

    await this.orderStatusRepository.save(statusHistory);

    // Handle status-specific actions
    await this.handleStatusChangeActions(id, newStatus.name);

    return await this.findOrderById(id, user);
  }

  async getOrderStatusHistory(orderId: string, user?: User): Promise<OrderStatus[]> {
    const order = await this.findOrderById(orderId, user);
    return order.statusHistory.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // Driver operations
  async assignDriver(orderId: string, assignDriverDto: AssignDriverDto, user?: User): Promise<Order> {
    const order = await this.findOrderById(orderId, user);

    // Check if user can assign drivers
    if (user && (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
      const hasAccess = await this.checkRestaurantAccess(user, order.restaurantId);
      if (!hasAccess) {
        throw new ForbiddenException('You can only assign drivers to orders from your restaurant');
      }
    }

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
      }, user);
    }

    return await this.findOrderById(orderId, user);
  }

  // Specialized queries
  async findKitchenOrders(searchDto: KitchenOrderSearchDto, user?: User): Promise<Order[]> {
    const { restaurantId, statusId, date } = searchDto;

    const where: FindOptionsWhere<Order> = {
      orderType: In([OrderType.DINE_IN, OrderType.TAKEAWAY, OrderType.DELIVERY])
    };

    // Apply restaurant filtering based on user role
    if (user) {
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
        const userRestaurantId = await this.getUserRestaurantId(user);
        where.restaurantId = userRestaurantId;
      } else if (restaurantId && user.role.name === UserRoleEnum.ADMIN) {
        where.restaurantId = restaurantId;
      } else {
        throw new ForbiddenException('You do not have access to kitchen orders');
      }
    }

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

  async findDeliveryOrders(searchDto: DeliveryOrderSearchDto, user?: User): Promise<Order[]> {
    const { restaurantId, driverId, statusId } = searchDto;

    const where: FindOptionsWhere<Order> = {
      orderType: OrderType.DELIVERY
    };

    // Apply role-based filtering
    if (user) {
      if (user.role.name === UserRoleEnum.DRIVER) {
        where.driverId = user.id; // Drivers can only see their own deliveries
      } else if (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
        const userRestaurantId = await this.getUserRestaurantId(user);
        where.restaurantId = userRestaurantId; // Restaurant users can only see their restaurant's deliveries
      } else if (user.role.name === UserRoleEnum.ADMIN) {
        // Admin can see all, apply provided filters
        if (restaurantId) where.restaurantId = restaurantId;
        if (driverId) where.driverId = driverId;
      }
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
  async getOrderStatistics(statsDto: OrderStatsDto, user?: User): Promise<any> {
    const { restaurantId, startDate, endDate } = statsDto;

    const where: FindOptionsWhere<Order> = {
      createdAt: Between(new Date(startDate), new Date(endDate))
    };

    // Apply role-based filtering
    if (user) {
      if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
        const userRestaurantId = await this.getUserRestaurantId(user);
        where.restaurantId = userRestaurantId;
      } else if (restaurantId && user.role.name === UserRoleEnum.ADMIN) {
        where.restaurantId = restaurantId;
      } else if (user.role.name !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('You do not have access to order statistics');
      }
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

  async getRestaurantOrdersToday(restaurantId: string, user?: User): Promise<{ count: number, revenue: number }> {
    // Check restaurant access
    if (user && (user.role.name === UserRoleEnum.RESTAURANT_OWNER || user.role.name === UserRoleEnum.RESTAURANT_STAFF)) {
      const hasAccess = await this.checkRestaurantAccess(user, restaurantId);
      if (!hasAccess) {
        throw new ForbiddenException('You can only access orders from your restaurant');
      }
    }

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

  // New method for restaurant users to get their orders
  async getMyRestaurantOrders(user: User): Promise<{ data: Order[], total: number }> {
    const restaurantId = await this.getUserRestaurantId(user);

    const searchDto: OrderSearchDto = {
      restaurantId,
      page: 1,
      limit: 50
    };

    return this.findAllOrders(searchDto, user);
  }

  // Existing helper methods (keep the same logic)
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
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      order.actualDeliveryTime = new Date();
      await this.orderRepository.save(order);
    }
  }

  private async processOrderCompletion(orderId: string): Promise<void> {
    // Implementation for order completion processing
    console.log(`Processing completion for order ${orderId}`);
  }
}