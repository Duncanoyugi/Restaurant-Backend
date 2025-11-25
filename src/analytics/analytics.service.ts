import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ActivityLog, ActivityAction, EntityType } from './entities/activity-log.entity';
import { BusinessMetrics } from './entities/business-metrics.entity';
import { UserBehavior } from './entities/user-behavior.entity';
import { AnalyticsQueryDto, AnalyticsPeriod } from './dto/analytics-query.dto';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(BusinessMetrics)
    private businessMetricsRepository: Repository<BusinessMetrics>,
    @InjectRepository(UserBehavior)
    private userBehaviorRepository: Repository<UserBehavior>,
  ) {}

// In backend\src\analytics\analytics.service.ts
// Fix the logActivity method

  async logActivity(createActivityLogDto: CreateActivityLogDto) {
    try {
      // FIX: Use explicit field assignment instead of spreading
      const activityLogData: Partial<ActivityLog> = {
        userId: createActivityLogDto.userId,
        action: createActivityLogDto.action,
        entityType: createActivityLogDto.entityType,
        entityId: createActivityLogDto.entityId,
        description: createActivityLogDto.description,
        ipAddress: createActivityLogDto.ipAddress,
        userAgent: createActivityLogDto.userAgent,
        timestamp: new Date(),
      };

      // Handle oldValues and newValues properly
      if (createActivityLogDto.oldValues) {
        activityLogData.oldValues = JSON.stringify(createActivityLogDto.oldValues);
      }
      if (createActivityLogDto.newValues) {
        activityLogData.newValues = JSON.stringify(createActivityLogDto.newValues);
      }

      const activityLog = this.activityLogRepository.create(activityLogData);
      const savedLog = await this.activityLogRepository.save(activityLog);
      
      // FIX: Handle case where save returns an array
      const logEntity = Array.isArray(savedLog) ? savedLog[0] : savedLog;
      return this.formatActivityLog(logEntity);
    } catch (error) {
      this.logger.error('Failed to log activity', error.stack);
      throw error;
    }
  }
  async getActivityLogs(query: ActivityLogQueryDto) {
    const { page = 1, limit = 50, userId, action, entityType, entityId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate && endDate) {
      where.timestamp = Between(new Date(startDate), new Date(endDate));
    }

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });

    const formattedLogs = logs.map(log => this.formatActivityLog(log));

    return {
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Business Analytics Methods
  async getDashboardOverview(query: AnalyticsQueryDto) {
    const dateRange = this.getDateRange(query);
    
    const [
      revenueMetrics,
      orderMetrics,
      reservationMetrics,
      roomBookingMetrics,
      customerMetrics,
      topMenuItems
    ] = await Promise.all([
      this.getRevenueMetrics(dateRange, query.restaurantId),
      this.getOrderMetrics(dateRange, query.restaurantId),
      this.getReservationMetrics(dateRange, query.restaurantId),
      this.getRoomBookingMetrics(dateRange, query.restaurantId),
      this.getCustomerMetrics(dateRange, query.restaurantId),
      this.getTopMenuItems(dateRange, query.restaurantId, query.limit)
    ]);

    return {
      period: query.period,
      dateRange,
      revenue: revenueMetrics,
      orders: orderMetrics,
      reservations: reservationMetrics,
      roomBookings: roomBookingMetrics,
      customers: customerMetrics,
      topMenuItems,
    };
  }

  async getRevenueAnalytics(query: AnalyticsQueryDto) {
    const dateRange = this.getDateRange(query);
    
    const revenueData = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('DATE(metrics.date)', 'date')
      .addSelect('SUM(metrics.totalRevenue)', 'totalRevenue')
      .addSelect('SUM(metrics.onlineRevenue)', 'onlineRevenue')
      .addSelect('SUM(metrics.dineInRevenue)', 'dineInRevenue')
      .addSelect('SUM(metrics.deliveryRevenue)', 'deliveryRevenue')
      .where('metrics.date BETWEEN :startDate AND :endDate', dateRange)
      .andWhere(query.restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', {
        restaurantId: query.restaurantId
      })
      .groupBy('DATE(metrics.date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const comparisonData = await this.getComparisonData('revenue', dateRange, query.restaurantId);

    return {
      revenueData,
      comparison: comparisonData,
      summary: {
        totalRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.totalRevenue || 0), 0),
        onlineRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.onlineRevenue || 0), 0),
        dineInRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.dineInRevenue || 0), 0),
        deliveryRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.deliveryRevenue || 0), 0),
      }
    };
  }

  async getOrderAnalytics(query: AnalyticsQueryDto) {
    const dateRange = this.getDateRange(query);
    
    const orderData = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('DATE(metrics.date)', 'date')
      .addSelect('SUM(metrics.totalOrders)', 'totalOrders')
      .addSelect('SUM(metrics.onlineOrders)', 'onlineOrders')
      .addSelect('SUM(metrics.dineInOrders)', 'dineInOrders')
      .addSelect('SUM(metrics.deliveryOrders)', 'deliveryOrders')
      .addSelect('AVG(metrics.averageOrderValue)', 'averageOrderValue')
      .where('metrics.date BETWEEN :startDate AND :endDate', dateRange)
      .andWhere(query.restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', {
        restaurantId: query.restaurantId
      })
      .groupBy('DATE(metrics.date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const comparisonData = await this.getComparisonData('orders', dateRange, query.restaurantId);

    return {
      orderData,
      comparison: comparisonData,
      summary: {
        totalOrders: orderData.reduce((sum, item) => sum + parseInt(item.totalOrders || 0), 0),
        onlineOrders: orderData.reduce((sum, item) => sum + parseInt(item.onlineOrders || 0), 0),
        dineInOrders: orderData.reduce((sum, item) => sum + parseInt(item.dineInOrders || 0), 0),
        deliveryOrders: orderData.reduce((sum, item) => sum + parseInt(item.deliveryOrders || 0), 0),
        averageOrderValue: orderData.length > 0 ? 
          orderData.reduce((sum, item) => sum + parseFloat(item.averageOrderValue || 0), 0) / orderData.length : 0,
      }
    };
  }

  async getCustomerAnalytics(query: AnalyticsQueryDto) {
    const dateRange = this.getDateRange(query);
    
    const customerData = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('DATE(metrics.date)', 'date')
      .addSelect('SUM(metrics.newCustomers)', 'newCustomers')
      .addSelect('SUM(metrics.returningCustomers)', 'returningCustomers')
      .addSelect('AVG(metrics.customerSatisfactionScore)', 'satisfactionScore')
      .where('metrics.date BETWEEN :startDate AND :endDate', dateRange)
      .andWhere(query.restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', {
        restaurantId: query.restaurantId
      })
      .groupBy('DATE(metrics.date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      customerData,
      summary: {
        totalNewCustomers: customerData.reduce((sum, item) => sum + parseInt(item.newCustomers || 0), 0),
        totalReturningCustomers: customerData.reduce((sum, item) => sum + parseInt(item.returningCustomers || 0), 0),
        averageSatisfactionScore: customerData.length > 0 ? 
          customerData.reduce((sum, item) => sum + parseFloat(item.satisfactionScore || 0), 0) / customerData.length : 0,
        customerRetentionRate: customerData.length > 0 ? 
          (customerData.reduce((sum, item) => sum + parseInt(item.returningCustomers || 0), 0) / 
          (customerData.reduce((sum, item) => sum + parseInt(item.newCustomers || 0), 0) + 
           customerData.reduce((sum, item) => sum + parseInt(item.returningCustomers || 0), 0))) * 100 : 0
      }
    };
  }

  async getMenuPerformanceAnalytics(query: AnalyticsQueryDto) {
    const dateRange = this.getDateRange(query);
    
    const performanceData = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('metrics.date', 'date')
      .addSelect('metrics.topSellingItems', 'topSellingItems')
      .addSelect('metrics.lowPerformingItems', 'lowPerformingItems')
      .where('metrics.date BETWEEN :startDate AND :endDate', dateRange)
      .andWhere(query.restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', {
        restaurantId: query.restaurantId
      })
      .orderBy('metrics.date', 'ASC')
      .getMany();

    // Aggregate top selling items across the period
    const topItemsMap = new Map();
    performanceData.forEach(metric => {
      if (metric.topSellingItems) {
        try {
          const items = JSON.parse(metric.topSellingItems);
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (topItemsMap.has(item.id)) {
                topItemsMap.set(item.id, {
                  ...item,
                  quantity: topItemsMap.get(item.id).quantity + (item.quantity || 0),
                  revenue: topItemsMap.get(item.id).revenue + (item.revenue || 0)
                });
              } else {
                topItemsMap.set(item.id, item);
              }
            });
          }
        } catch (error) {
          this.logger.warn('Failed to parse topSellingItems JSON', error);
        }
      }
    });

    const topSellingItems = Array.from(topItemsMap.values())
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, query.limit || 10);

    return {
      topSellingItems,
      performanceTrend: performanceData.map(metric => ({
        date: metric.date,
        topItems: metric.topSellingItems ? 
          (() => {
            try {
              const items = JSON.parse(metric.topSellingItems);
              return Array.isArray(items) ? items.slice(0, 5) : [];
            } catch {
              return [];
            }
          })() : []
      }))
    };
  }

  // User Behavior Analytics
  async getUserBehaviorAnalytics(userId: string, query: AnalyticsQueryDto) {
    const dateRange = this.getDateRange(query);
    
    const behaviorData = await this.userBehaviorRepository
      .createQueryBuilder('behavior')
      .where('behavior.userId = :userId', { userId })
      .andWhere('behavior.sessionDate BETWEEN :startDate AND :endDate', dateRange)
      .orderBy('behavior.sessionDate', 'DESC')
      .getMany();

    const summary = behaviorData.reduce((acc, session) => ({
      totalSessions: acc.totalSessions + 1,
      totalPageViews: acc.totalPageViews + (session.pageViews || 0),
      totalMenuViews: acc.totalMenuViews + (session.menuViews || 0),
      totalItemsAddedToCart: acc.totalItemsAddedToCart + (session.itemsAddedToCart || 0),
      totalOrders: acc.totalOrders + (session.completedOrders || 0),
      totalReservations: acc.totalReservations + (session.completedReservations || 0),
      totalRoomBookings: acc.totalRoomBookings + (session.completedRoomBookings || 0),
      totalSessionDuration: acc.totalSessionDuration + (session.sessionDurationSeconds || 0),
    }), {
      totalSessions: 0,
      totalPageViews: 0,
      totalMenuViews: 0,
      totalItemsAddedToCart: 0,
      totalOrders: 0,
      totalReservations: 0,
      totalRoomBookings: 0,
      totalSessionDuration: 0,
    });

    return {
      sessions: behaviorData,
      summary: {
        ...summary,
        averageSessionDuration: summary.totalSessions > 0 ? summary.totalSessionDuration / summary.totalSessions : 0,
        conversionRate: summary.totalSessions > 0 ? 
          ((summary.totalOrders + summary.totalReservations + summary.totalRoomBookings) / summary.totalSessions) * 100 : 0
      }
    };
  }

  // Helper Methods
  private getDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (query.period) {
      case AnalyticsPeriod.TODAY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case AnalyticsPeriod.YESTERDAY:
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case AnalyticsPeriod.LAST_7_DAYS:
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case AnalyticsPeriod.LAST_30_DAYS:
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case AnalyticsPeriod.LAST_90_DAYS:
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case AnalyticsPeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case AnalyticsPeriod.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case AnalyticsPeriod.CUSTOM:
        // Add null checks for custom date range
        startDate = query.startDate ? new Date(query.startDate) : new Date(now.setDate(now.getDate() - 7));
        endDate = query.endDate ? new Date(query.endDate) : new Date();
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    if (query.period !== AnalyticsPeriod.CUSTOM && query.period !== AnalyticsPeriod.YESTERDAY && query.period !== AnalyticsPeriod.LAST_MONTH) {
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  private async getComparisonData(metricType: string, currentRange: { startDate: Date; endDate: Date }, restaurantId?: string) {
    const currentDuration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
    const previousStartDate = new Date(currentRange.startDate.getTime() - currentDuration);
    const previousEndDate = new Date(currentRange.endDate.getTime() - currentDuration);

    let currentValue: number;
    let previousValue: number;

    switch (metricType) {
      case 'revenue':
        currentValue = await this.getTotalRevenue(currentRange, restaurantId);
        previousValue = await this.getTotalRevenue({ startDate: previousStartDate, endDate: previousEndDate }, restaurantId);
        break;
      case 'orders':
        currentValue = await this.getTotalOrders(currentRange, restaurantId);
        previousValue = await this.getTotalOrders({ startDate: previousStartDate, endDate: previousEndDate }, restaurantId);
        break;
      default:
        currentValue = 0;
        previousValue = 0;
    }

    const change = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

    return {
      currentValue,
      previousValue,
      change,
      isPositive: change > 0
    };
  }

  private async getTotalRevenue(range: { startDate: Date; endDate: Date }, restaurantId?: string): Promise<number> {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.totalRevenue)', 'total')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getTotalOrders(range: { startDate: Date; endDate: Date }, restaurantId?: string): Promise<number> {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.totalOrders)', 'total')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return parseInt(result?.total || '0');
  }

  // Private helper methods for dashboard overview
  private async getRevenueMetrics(range: { startDate: Date; endDate: Date }, restaurantId?: string) {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.totalRevenue)', 'totalRevenue')
      .addSelect('SUM(metrics.onlineRevenue)', 'onlineRevenue')
      .addSelect('SUM(metrics.dineInRevenue)', 'dineInRevenue')
      .addSelect('SUM(metrics.deliveryRevenue)', 'deliveryRevenue')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return {
      totalRevenue: parseFloat(result?.totalRevenue || '0'),
      onlineRevenue: parseFloat(result?.onlineRevenue || '0'),
      dineInRevenue: parseFloat(result?.dineInRevenue || '0'),
      deliveryRevenue: parseFloat(result?.deliveryRevenue || '0'),
    };
  }

  private async getOrderMetrics(range: { startDate: Date; endDate: Date }, restaurantId?: string) {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.totalOrders)', 'totalOrders')
      .addSelect('SUM(metrics.onlineOrders)', 'onlineOrders')
      .addSelect('SUM(metrics.dineInOrders)', 'dineInOrders')
      .addSelect('SUM(metrics.deliveryOrders)', 'deliveryOrders')
      .addSelect('AVG(metrics.averageOrderValue)', 'averageOrderValue')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return {
      totalOrders: parseInt(result?.totalOrders || '0'),
      onlineOrders: parseInt(result?.onlineOrders || '0'),
      dineInOrders: parseInt(result?.dineInOrders || '0'),
      deliveryOrders: parseInt(result?.deliveryOrders || '0'),
      averageOrderValue: parseFloat(result?.averageOrderValue || '0'),
    };
  }

  private async getReservationMetrics(range: { startDate: Date; endDate: Date }, restaurantId?: string) {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.totalReservations)', 'totalReservations')
      .addSelect('SUM(metrics.confirmedReservations)', 'confirmedReservations')
      .addSelect('SUM(metrics.cancelledReservations)', 'cancelledReservations')
      .addSelect('AVG(metrics.reservationUtilizationRate)', 'utilizationRate')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return {
      totalReservations: parseInt(result?.totalReservations || '0'),
      confirmedReservations: parseInt(result?.confirmedReservations || '0'),
      cancelledReservations: parseInt(result?.cancelledReservations || '0'),
      utilizationRate: parseFloat(result?.utilizationRate || '0'),
    };
  }

  private async getRoomBookingMetrics(range: { startDate: Date; endDate: Date }, restaurantId?: string) {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.totalRoomBookings)', 'totalBookings')
      .addSelect('SUM(metrics.occupiedRooms)', 'occupiedRooms')
      .addSelect('AVG(metrics.occupancyRate)', 'occupancyRate')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return {
      totalBookings: parseInt(result?.totalBookings || '0'),
      occupiedRooms: parseInt(result?.occupiedRooms || '0'),
      occupancyRate: parseFloat(result?.occupancyRate || '0'),
    };
  }

  private async getCustomerMetrics(range: { startDate: Date; endDate: Date }, restaurantId?: string) {
    const result = await this.businessMetricsRepository
      .createQueryBuilder('metrics')
      .select('SUM(metrics.newCustomers)', 'newCustomers')
      .addSelect('SUM(metrics.returningCustomers)', 'returningCustomers')
      .addSelect('AVG(metrics.customerSatisfactionScore)', 'satisfactionScore')
      .where('metrics.date BETWEEN :startDate AND :endDate', range)
      .andWhere(restaurantId ? 'metrics.restaurantId = :restaurantId' : '1=1', { restaurantId })
      .getRawOne();

    return {
      newCustomers: parseInt(result?.newCustomers || '0'),
      returningCustomers: parseInt(result?.returningCustomers || '0'),
      satisfactionScore: parseFloat(result?.satisfactionScore || '0'),
    };
  }

  private async getTopMenuItems(range: { startDate: Date; endDate: Date }, restaurantId?: string, limit: number = 10) {
    // This would typically query order_items table
    // For now, return empty array
    return [];
  }

  private formatActivityLog(log: ActivityLog) {
    return {
      ...log,
      oldValues: log.oldValues ? this.safeJsonParse(log.oldValues) : null,
      newValues: log.newValues ? this.safeJsonParse(log.newValues) : null,
      user: log.user ? {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
      } : null,
    };
  }

  private safeJsonParse(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}