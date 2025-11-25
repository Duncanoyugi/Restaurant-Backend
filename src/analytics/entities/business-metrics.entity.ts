import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('business_metrics')
@Index(['restaurantId', 'date'])
@Index(['date'])
export class BusinessMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'date' })
  date: Date;

  // Revenue metrics
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_revenue' })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'online_revenue' })
  onlineRevenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'dine_in_revenue' })
  dineInRevenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'delivery_revenue' })
  deliveryRevenue: number;

  // Order metrics
  @Column({ type: 'int', name: 'total_orders' })
  totalOrders: number;

  @Column({ type: 'int', name: 'online_orders' })
  onlineOrders: number;

  @Column({ type: 'int', name: 'dine_in_orders' })
  dineInOrders: number;

  @Column({ type: 'int', name: 'delivery_orders' })
  deliveryOrders: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'average_order_value' })
  averageOrderValue: number;

  // Customer metrics
  @Column({ type: 'int', name: 'new_customers' })
  newCustomers: number;

  @Column({ type: 'int', name: 'returning_customers' })
  returningCustomers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'customer_satisfaction_score' })
  customerSatisfactionScore: number;

  // Reservation metrics
  @Column({ type: 'int', name: 'total_reservations' })
  totalReservations: number;

  @Column({ type: 'int', name: 'confirmed_reservations' })
  confirmedReservations: number;

  @Column({ type: 'int', name: 'cancelled_reservations' })
  cancelledReservations: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'reservation_utilization_rate' })
  reservationUtilizationRate: number;

  // Room booking metrics
  @Column({ type: 'int', name: 'total_room_bookings' })
  totalRoomBookings: number;

  @Column({ type: 'int', name: 'occupied_rooms' })
  occupiedRooms: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'occupancy_rate' })
  occupancyRate: number;

  // Menu performance
  @Column({ type: 'nvarchar', nullable: true, name: 'top_selling_items' })
  topSellingItems: string;

  @Column({ type: 'nvarchar', nullable: true, name: 'low_performing_items' })
  lowPerformingItems: string;

  // Operational metrics
  @Column({ type: 'int', name: 'total_preparation_time_minutes' })
  totalPreparationTimeMinutes: number;

  @Column({ type: 'int', name: 'average_preparation_time_minutes' })
  averagePreparationTimeMinutes: number;

  @Column({ type: 'int', name: 'total_delivery_time_minutes' })
  totalDeliveryTimeMinutes: number;

  @Column({ type: 'int', name: 'average_delivery_time_minutes' })
  averageDeliveryTimeMinutes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}