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
  ParseUUIDPipe
} from '@nestjs/common';
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

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  createBulk(@Body() bulkNotificationDto: BulkNotificationDto) {
    return this.notificationService.createBulk(bulkNotificationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: NotificationQueryDto, @Request() req) {
    return this.notificationService.findByUserId(req.user.id, query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req) {
    return this.notificationService.getNotificationStats(req.user.id);
  }

  @Get('unread/count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  findAllAdmin(@Query() query: NotificationQueryDto) {
    return this.notificationService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @Body() markReadDto: MarkReadDto) {
    return this.notificationService.markAsRead(id, markReadDto);
  }

  @Post('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.remove(id);
  }

  // System notification endpoints
  @Post('system/cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async cleanupExpired() {
    return this.notificationService.cleanupExpiredNotifications();
  }
}