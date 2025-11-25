import { IsArray, IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { NotificationType, NotificationPriority, NotificationChannel } from '../entities/notification.entity';

export class BulkNotificationDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  actionLabel?: string;
}