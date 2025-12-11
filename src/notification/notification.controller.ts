import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe
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
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ==================== NOTIFICATION MANAGEMENT ====================

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: CreateNotificationDto })
  create(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    return this.notificationService.create(createNotificationDto, req.user);
  }

  @Post('bulk')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create multiple notifications in bulk' })
  @ApiResponse({ status: 201, description: 'Notifications created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: BulkNotificationDto })
  createBulk(@Body() bulkNotificationDto: BulkNotificationDto, @Request() req) {
    return this.notificationService.createBulk(bulkNotificationDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications with filtering' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ type: NotificationQueryDto })
  findAll(@Query() query: NotificationQueryDto, @Request() req) {
    return this.notificationService.findByUserId(req.user.id, query, req.user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics for current user' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@Request() req) {
    return this.notificationService.getNotificationStats(req.user.id, req.user);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.id, req.user);
  }

  @Get('admin')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'All notifications retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiQuery({ type: NotificationQueryDto })
  findAllAdmin(@Query() query: NotificationQueryDto, @Request() req) {
    return this.notificationService.findAll(query, req.user);
  }

  @Get('restaurant')
  @Roles(UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get restaurant notifications' })
  @ApiResponse({ status: 200, description: 'Restaurant notifications retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant access required' })
  @ApiQuery({ type: NotificationQueryDto })
  findRestaurantNotifications(@Query() query: NotificationQueryDto, @Request() req) {
    return this.notificationService.findRestaurantNotifications(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificationService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiBody({ type: UpdateNotificationDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req
  ) {
    return this.notificationService.update(id, updateNotificationDto, req.user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiBody({ type: MarkReadDto })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() markReadDto: MarkReadDto,
    @Request() req
  ) {
    return this.notificationService.markAsRead(id, markReadDto, req.user);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.id, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification by ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete this notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: Number })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificationService.remove(id, req.user);
  }

  // ==================== SYSTEM NOTIFICATIONS ====================

  @Post('system/cleanup')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Clean up expired notifications' })
  @ApiResponse({ status: 200, description: 'Expired notifications cleaned up successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async cleanupExpired(@Request() req) {
    return this.notificationService.cleanupExpiredNotifications(req.user);
  }

  // ==================== RESTAURANT NOTIFICATIONS ====================

  @Post('restaurant/broadcast')
  @Roles(UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Broadcast notification to restaurant customers' })
  @ApiResponse({ status: 201, description: 'Broadcast notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant Owner access required' })
  @ApiBody({ type: CreateNotificationDto })
  async broadcastToRestaurantCustomers(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req
  ) {
    return this.notificationService.broadcastToRestaurantCustomers(createNotificationDto, req.user);
  }

  // ==================== DRIVER NOTIFICATIONS ====================

  @Get('driver/orders')
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get driver order notifications' })
  @ApiResponse({ status: 200, description: 'Driver notifications retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  @ApiQuery({ type: NotificationQueryDto })
  getDriverOrderNotifications(@Query() query: NotificationQueryDto, @Request() req) {
    return this.notificationService.getDriverOrderNotifications(query, req.user);
  }

  // ==================== BUSINESS WORKFLOW NOTIFICATIONS ====================

  @Post('order-confirmed')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Send order confirmed notification' })
  @ApiResponse({ status: 201, description: 'Order notification sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        orderData: { type: 'object' }
      },
      required: ['userId', 'orderData']
    }
  })
  async notifyOrderConfirmed(
    @Body() body: { userId: number; orderData: any },
    @Request() req
  ) {
    return this.notificationService.notifyOrderConfirmed(body.userId, body.orderData, req.user);
  }

  @Post('reservation-confirmed')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Send reservation confirmed notification' })
  @ApiResponse({ status: 201, description: 'Reservation notification sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        reservationData: { type: 'object' }
      },
      required: ['userId', 'reservationData']
    }
  })
  async notifyReservationConfirmed(
    @Body() body: { userId: number; reservationData: any },
    @Request() req
  ) {
    return this.notificationService.notifyReservationConfirmed(body.userId, body.reservationData, req.user);
  }

  @Post('payment-success')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Send payment success notification' })
  @ApiResponse({ status: 201, description: 'Payment notification sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        paymentData: { type: 'object' }
      },
      required: ['userId', 'paymentData']
    }
  })
  async notifyPaymentSuccess(
    @Body() body: { userId: number; paymentData: any },
    @Request() req
  ) {
    return this.notificationService.notifyPaymentSuccess(body.userId, body.paymentData, req.user);
  }

  @Post('delivery-assigned')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Send delivery assigned notification' })
  @ApiResponse({ status: 201, description: 'Delivery notification sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        deliveryData: { type: 'object' }
      },
      required: ['userId', 'deliveryData']
    }
  })
  async notifyDeliveryAssigned(
    @Body() body: { userId: number; deliveryData: any },
    @Request() req
  ) {
    return this.notificationService.notifyDeliveryAssigned(body.userId, body.deliveryData, req.user);
  }

  @Post('low-inventory')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Send low inventory alert to admins' })
  @ApiResponse({ status: 201, description: 'Inventory alert sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminUserIds: { type: 'array', items: { type: 'number' } },
        inventoryData: { type: 'object' }
      },
      required: ['adminUserIds', 'inventoryData']
    }
  })
  async notifyLowInventory(
    @Body() body: { adminUserIds: number[]; inventoryData: any },
    @Request() req
  ) {
    return this.notificationService.notifyLowInventory(body.adminUserIds, body.inventoryData, req.user);
  }

  @Post('new-review')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Send new review notification' })
  @ApiResponse({ status: 201, description: 'Review notification sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reviewData: { type: 'object' }
      },
      required: ['reviewData']
    }
  })
  async notifyNewReview(
    @Body() body: { reviewData: any },
    @Request() req
  ) {
    return this.notificationService.notifyNewReview(body.reviewData, req.user);
  }
}