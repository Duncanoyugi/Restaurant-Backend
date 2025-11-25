import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user-role.entity';
import { Order } from '../../order/entities/order.entity';
import { Address } from '../../location/entities/address.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';
import { Review } from '../../review/entities/review.entity';
import { VehicleInfo } from '../../delivery/entities/vehicle-info.entity';
import { RestaurantStaff } from '../../restaurant/entities/restaurant-staff.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';

// Add UserStatus enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index(['email'])
@Index(['phone'])
@Index(['roleId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'bit', default: 0, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'profile_image' })
  profileImage: string;

  @Column({ type: 'bit', default: 1 })
  active: boolean;

  // Add status field
  @Column({ type: 'varchar', length: 30, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reset_token' })
  resetToken: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'verification_token' })
  verificationToken: string;

  @Column({ type: 'datetime', nullable: true, name: 'reset_token_expiry' })
  resetTokenExpiry: Date;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId: string;

  // Driver-specific fields
  @Column({ type: 'bit', default: 0, name: 'is_online' })
  isOnline: boolean;

  @Column({ type: 'bit', default: 0, name: 'is_available' })
  isAvailable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'current_latitude' })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'current_longitude' })
  currentLongitude: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'int', default: 0, name: 'total_deliveries' })
  totalDeliveries: number;

  @ManyToOne(() => UserRole, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: UserRole;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Order, (order) => order.driver)
  deliveries: Order[];

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToOne(() => VehicleInfo, (vehicle) => vehicle.user)
  vehicleInfo: VehicleInfo;

  @OneToOne(() => RestaurantStaff, (staff) => staff.user)
  restaurantStaff: RestaurantStaff;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  ownedRestaurants: Restaurant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}