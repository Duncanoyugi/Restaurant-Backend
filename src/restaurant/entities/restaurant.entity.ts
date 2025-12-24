import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { MenuItem } from '../../menu/entities/menu.entity';
import { Room } from '../../room/entities/room.entity';
import { Table } from '../../reservation/entities/table.entity';
import { RestaurantStaff } from './restaurant-staff.entity';
import { Shift } from './shift.entity';
import { StaffAssignment } from './staff-assignment.entity';
import { DriverAssignment } from './driver-assignment.entity';
import { City } from '../../location/entities/city.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('restaurant')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'street_address' })
  streetAddress: string;

  @Column({ type: 'varchar', length: 20, name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cover_image_url' })
  coverImageUrl: string;

  @Column({ type: 'time', nullable: true, name: 'opening_time' })
  openingTime: string;

  @Column({ type: 'time', nullable: true, name: 'closing_time' })
  closingTime: string;

  @Column({ type: 'bit', default: 1 })
  active: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ name: 'city_id' })
  cityId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // RELATIONSHIPS
  @ManyToOne(() => User, user => user.ownedRestaurants)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => MenuItem, menu => menu.restaurant)
  menus: MenuItem[];

  @OneToMany(() => Room, room => room.restaurant)
  rooms: Room[];

  @OneToMany(() => Table, table => table.restaurant)
  tables: Table[];

  @OneToMany(() => RestaurantStaff, staff => staff.restaurant)
  staff: RestaurantStaff[];

  @ManyToOne(() => City, (city) => city.restaurants)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
  menuItems: MenuItem[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @OneToMany(() => Shift, shift => shift.staff)
  shifts: Shift[];

  @OneToMany(() => StaffAssignment, assignment => assignment.restaurant)
  staffAssignments: StaffAssignment[];

  @OneToMany(() => DriverAssignment, assignment => assignment.restaurant)
  driverAssignments: DriverAssignment[];
}