import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsUUID, 
  IsObject, 
  IsDateString,
  IsBoolean
} from 'class-validator';
import { NotificationType, NotificationPriority, NotificationChannel } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

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

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  actionLabel?: string;
}