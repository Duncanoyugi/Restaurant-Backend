// backend\src\order\order.controller.ts
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
  ForbiddenException,
  NotFoundException
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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatusDto } from './dto/order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { OrderSearchDto } from './dto/order-search.dto';
import { KitchenOrderSearchDto } from './dto/kitchen-order.dto';
import { DeliveryOrderSearchDto } from './dto/delivery-order.dto';
import { OrderStatsDto } from './dto/order-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Order endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer access required' })
  @ApiBody({ type: CreateOrderDto })
  createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // Customers can only create orders for themselves
    if (createOrderDto.userId && createOrderDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create orders for yourself');
    }
    
    // Auto-assign user ID if not provided
    const orderData = {
      ...createOrderDto,
      userId: createOrderDto.userId || req.user.id
    };
    
    return this.orderService.createOrder(orderData, req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get all orders with filtering (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiQuery({ type: OrderSearchDto })
  findAllOrders(@Query() searchDto: OrderSearchDto, @Request() req) {
    return this.orderService.findAllOrders(searchDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  findOrderById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.orderService.findOrderById(id, req.user);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'orderNumber', description: 'Order number', type: String })
  findOrderByNumber(@Param('orderNumber') orderNumber: string, @Request() req) {
    return this.orderService.findOrderByNumber(orderNumber, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order by ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiBody({ type: UpdateOrderDto })
  updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req
  ) {
    return this.orderService.updateOrder(id, updateOrderDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order by ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  removeOrder(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.orderService.removeOrder(id, req.user);
  }

  // Order Status endpoints
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Update order status (Admin, Restaurant Owner, Staff & Driver only)' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner, Staff or Driver access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiBody({ type: OrderStatusDto })
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: OrderStatusDto,
    @Request() req
  ) {
    return this.orderService.updateOrderStatus(id, statusDto, req.user);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Status history retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  getOrderStatusHistory(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.orderService.getOrderStatusHistory(id, req.user);
  }

  // Driver endpoints
  @Patch(':id/assign-driver')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Assign driver to order (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Driver assigned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiResponse({ status: 404, description: 'Order or driver not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiBody({ type: AssignDriverDto })
  assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDriverDto: AssignDriverDto,
    @Request() req
  ) {
    return this.orderService.assignDriver(id, assignDriverDto, req.user);
  }

  // Specialized queries
  @Get('kitchen/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get kitchen orders with filtering (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Kitchen orders retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiQuery({ type: KitchenOrderSearchDto })
  findKitchenOrders(@Query() searchDto: KitchenOrderSearchDto, @Request() req) {
    return this.orderService.findKitchenOrders(searchDto, req.user);
  }

  @Get('delivery/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get delivery orders with filtering (Admin, Restaurant Owner, Staff & Driver only)' })
  @ApiResponse({ status: 200, description: 'Delivery orders retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner, Staff or Driver access required' })
  @ApiQuery({ type: DeliveryOrderSearchDto })
  findDeliveryOrders(@Query() searchDto: DeliveryOrderSearchDto, @Request() req) {
    return this.orderService.findDeliveryOrders(searchDto, req.user);
  }

  // Analytics endpoints
  @Get('analytics/statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get order statistics with filtering (Admin & Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Restaurant Owner access required' })
  @ApiQuery({ type: OrderStatsDto })
  getOrderStatistics(@Query() statsDto: OrderStatsDto, @Request() req) {
    return this.orderService.getOrderStatistics(statsDto, req.user);
  }

  @Get('analytics/restaurant/:restaurantId/today')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get today orders for restaurant (Admin, Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Todays orders retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Restaurant Owner or Staff access required' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  getRestaurantOrdersToday(@Param('restaurantId', ParseIntPipe) restaurantId: number, @Request() req) {
    return this.orderService.getRestaurantOrdersToday(restaurantId, req.user);
  }

  // User-specific endpoints
  @Get('user/my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  getMyOrders(@Request() req) {
    const searchDto: OrderSearchDto = { userId: req.user.id };
    return this.orderService.findAllOrders(searchDto, req.user);
  }

  @Post('user/my-orders/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel a user order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot cancel this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: Number })
  async cancelMyOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('reason') reason: string,
    @Request() req
  ) {
    // Use the specialized service method for customer order cancellation
    return this.orderService.cancelCustomerOrder(orderId, reason, req.user);
  }

  @Get('driver/my-deliveries')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get current driver delivery orders (Driver only)' })
  @ApiResponse({ status: 200, description: 'Driver deliveries retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  getMyDeliveries(@Request() req) {
    const searchDto: DeliveryOrderSearchDto = { driverId: req.user.id };
    return this.orderService.findDeliveryOrders(searchDto, req.user);
  }

  @Get('restaurant/my-orders')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get current restaurant orders (Restaurant Owner & Staff only)' })
  @ApiResponse({ status: 200, description: 'Restaurant orders retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner or Staff access required' })
  getMyRestaurantOrders(@Request() req) {
    return this.orderService.getMyRestaurantOrders(req.user);
  }
}