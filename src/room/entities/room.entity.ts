import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { RoomBooking } from './room-booking.entity';

@Entity('room')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'restaurant_id' })
  restaurantId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_night' })
  pricePerNight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'original_price' })
  originalPrice: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'bed_type' })
  bedType: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  // FIX: Change simple-json to nvarchar for MSSQL
  @Column({ type: 'nvarchar', nullable: true })
  amenities: string;

  @Column({ type: 'nvarchar', nullable: true })
  features: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  discount: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  imageUrl: string;

  // FIX: Change simple-json to nvarchar for MSSQL
  @Column({ type: 'nvarchar', nullable: true, name: 'image_gallery' })
  imageGallery: string;

  // FIX: Change boolean to bit for MSSQL
  @Column({ type: 'bit', default: 1 })
  available: boolean;

  @Column({ type: 'bit', default: 0 })
  featured: boolean;

  @Column({ type: 'bit', default: 0 })
  popular: boolean;

  @Column({ type: 'bit', default: 0 })
  family: boolean;

  @Column({ type: 'bit', default: 0 })
  luxury: boolean;

  @Column({ type: 'bit', default: 0 })
  romantic: boolean;

  @Column({ type: 'bit', default: 0 })
  accessible: boolean;

  @Column({ type: 'bit', default: 0, name: 'pet_friendly' })
  petFriendly: boolean;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.rooms)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @OneToMany(() => RoomBooking, (booking) => booking.room)
  bookings: RoomBooking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}