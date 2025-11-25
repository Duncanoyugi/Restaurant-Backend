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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatusDto } from './dto/order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { OrderSearchDto } from './dto/order-search.dto';
import { KitchenOrderSearchDto } from './dto/kitchen-order.dto';
import { DeliveryOrderSearchDto } from './dto/delivery-order.dto';
import { OrderStatsDto } from './dto/order-stats.dto';

@ApiTags('orders')
@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Order endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateOrderDto })
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filtering' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ type: OrderSearchDto })
  findAllOrders(@Query() searchDto: OrderSearchDto) {
    return this.orderService.findAllOrders(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  findOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOrderById(id);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'orderNumber', description: 'Order number', type: String })
  findOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findOrderByNumber(orderNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order by ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiBody({ type: UpdateOrderDto })
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order by ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  removeOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.removeOrder(id);
  }

  // Order Status endpoints
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiBody({ type: OrderStatusDto })
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: OrderStatusDto
  ) {
    return this.orderService.updateOrderStatus(id, statusDto);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Status history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  getOrderStatusHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getOrderStatusHistory(id);
  }

  // Driver endpoints
  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'Assign driver to order' })
  @ApiResponse({ status: 200, description: 'Driver assigned successfully' })
  @ApiResponse({ status: 404, description: 'Order or driver not found' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiBody({ type: AssignDriverDto })
  assignDriver(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() assignDriverDto: AssignDriverDto
  ) {
    return this.orderService.assignDriver(id, assignDriverDto);
  }

  // Specialized queries
  @Get('kitchen/orders')
  @ApiOperation({ summary: 'Get kitchen orders with filtering' })
  @ApiResponse({ status: 200, description: 'Kitchen orders retrieved successfully' })
  @ApiQuery({ type: KitchenOrderSearchDto })
  findKitchenOrders(@Query() searchDto: KitchenOrderSearchDto) {
    return this.orderService.findKitchenOrders(searchDto);
  }

  @Get('delivery/orders')
  @ApiOperation({ summary: 'Get delivery orders with filtering' })
  @ApiResponse({ status: 200, description: 'Delivery orders retrieved successfully' })
  @ApiQuery({ type: DeliveryOrderSearchDto })
  findDeliveryOrders(@Query() searchDto: DeliveryOrderSearchDto) {
    return this.orderService.findDeliveryOrders(searchDto);
  }

  // Analytics endpoints
  @Get('analytics/statistics')
  @ApiOperation({ summary: 'Get order statistics with filtering' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  @ApiQuery({ type: OrderStatsDto })
  getOrderStatistics(@Query() statsDto: OrderStatsDto) {
    return this.orderService.getOrderStatistics(statsDto);
  }

  @Get('analytics/restaurant/:restaurantId/today')
  @ApiOperation({ summary: 'Get today orders for restaurant' })
  @ApiResponse({ status: 200, description: 'Todays orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  getRestaurantOrdersToday(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.orderService.getRestaurantOrdersToday(restaurantId);
  }
}