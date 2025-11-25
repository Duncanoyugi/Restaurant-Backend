import { IsOptional, IsEnum, IsDateString, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum AnalyticsPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom'
}

export enum MetricsType {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  RESERVATIONS = 'reservations',
  ROOM_BOOKINGS = 'room_bookings',
  CUSTOMERS = 'customers',
  MENU_PERFORMANCE = 'menu_performance',
  OPERATIONAL = 'operational'
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.LAST_7_DAYS;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}