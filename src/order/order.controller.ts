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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatusDto } from './dto/order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { OrderSearchDto } from './dto/order-search.dto';
import { KitchenOrderSearchDto } from './dto/kitchen-order.dto';
import { DeliveryOrderSearchDto } from './dto/delivery-order.dto';
import { OrderStatsDto } from './dto/order-stats.dto';

@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Order endpoints
  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  findAllOrders(@Query() searchDto: OrderSearchDto) {
    return this.orderService.findAllOrders(searchDto);
  }

  @Get(':id')
  findOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOrderById(id);
  }

  @Get('number/:orderNumber')
  findOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findOrderByNumber(orderNumber);
  }

  @Patch(':id')
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  removeOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.removeOrder(id);
  }

  // Order Status endpoints
  @Patch(':id/status')
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: OrderStatusDto
  ) {
    return this.orderService.updateOrderStatus(id, statusDto);
  }

  @Get(':id/status-history')
  getOrderStatusHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getOrderStatusHistory(id);
  }

  // Driver endpoints
  @Patch(':id/assign-driver')
  assignDriver(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() assignDriverDto: AssignDriverDto
  ) {
    return this.orderService.assignDriver(id, assignDriverDto);
  }

  // Specialized queries
  @Get('kitchen/orders')
  findKitchenOrders(@Query() searchDto: KitchenOrderSearchDto) {
    return this.orderService.findKitchenOrders(searchDto);
  }

  @Get('delivery/orders')
  findDeliveryOrders(@Query() searchDto: DeliveryOrderSearchDto) {
    return this.orderService.findDeliveryOrders(searchDto);
  }

  // Analytics endpoints
  @Get('analytics/statistics')
  getOrderStatistics(@Query() statsDto: OrderStatsDto) {
    return this.orderService.getOrderStatistics(statsDto);
  }

  @Get('analytics/restaurant/:restaurantId/today')
  getRestaurantOrdersToday(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.orderService.getRestaurantOrdersToday(restaurantId);
  }
}