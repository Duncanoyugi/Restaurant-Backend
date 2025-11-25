import { IsEnum, IsOptional, IsString, IsObject, IsUUID } from 'class-validator';
import { ActivityAction, EntityType } from '../entities/activity-log.entity';

export class CreateActivityLogDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsEnum(EntityType)
  entityType: EntityType;

  @IsString()
  entityId: string;

  @IsObject()
  @IsOptional()
  oldValues?: Record<string, any>;

  @IsObject()
  @IsOptional()
  newValues?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}