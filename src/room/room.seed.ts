import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Injectable()
export class RoomSeeder implements OnModuleInit {
    private readonly logger = new Logger(RoomSeeder.name);

    constructor(
        @InjectRepository(Room)
        private roomRepo: Repository<Room>,
        @InjectRepository(Restaurant)
        private restaurantRepo: Repository<Restaurant>,
    ) { }

    async onModuleInit() {
        // Wait for restaurant to be seeded
        setTimeout(async () => {
            try {
                await this.seedRooms();
            } catch (error) {
                this.logger.error(`Error seeding rooms: ${error.message}`);
                setTimeout(async () => {
                    try {
                        await this.seedRooms();
                    } catch (retryError) {
                        this.logger.error(`Error seeding rooms on retry: ${retryError.message}`);
                    }
                }, 20000);
            }
        }, 15000); // Wait longer than restaurant seeder
    }

    private async seedRooms() {
        // Find default restaurant
        const restaurant = await this.restaurantRepo.findOne({
            where: { email: 'info@thegrandrestaurant.co.ke' },
        });

        if (!restaurant) {
            this.logger.error('Default restaurant not found. Cannot seed rooms.');
            return;
        }

        const USD_TO_KES_RATE = 129;

        const roomsData = [
            // STANDARD ROOMS
            {
                name: 'Classic Queen Room',
                category: 'standard',
                description: 'Our most affordable option with a comfortable queen bed and essential amenities. Perfect for solo travelers or couples on a budget.',
                pricePerNight: 129 * USD_TO_KES_RATE, // 16,641 KSh
                originalPrice: 149 * USD_TO_KES_RATE, // 19,221 KSh
                size: '35 m²',
                bedType: 'Queen Bed',
                capacity: 2,
                features: JSON.stringify(['Free WiFi', 'Air Conditioning', 'Smart TV', 'Work Desk', 'Private Bathroom']),
                imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&auto=format&fit=crop&q=80',
                ]),
                discount: '15% OFF',
                available: true,
                featured: false,
            },
            {
                name: 'Twin Room',
                category: 'standard',
                description: 'Two comfortable single beds ideal for friends or colleagues traveling together.',
                pricePerNight: 139 * USD_TO_KES_RATE, // 17,931 KSh
                originalPrice: 159 * USD_TO_KES_RATE, // 20,511 KSh
                size: '38 m²',
                bedType: 'Two Single Beds',
                capacity: 2,
                features: JSON.stringify(['Free WiFi', 'AC', '32" TV', 'Mini Fridge', 'City View']),
                imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&auto=format&fit=crop&q=80'
                ]),
                discount: '12% OFF',
                available: true,
                featured: false,
            },

            // DELUXE ROOMS
            {
                name: 'Deluxe King Room',
                category: 'deluxe',
                description: 'Spacious room with a king-sized bed and panoramic city views. Upgraded amenities and extra comfort.',
                pricePerNight: 199 * USD_TO_KES_RATE, // 25,671 KSh
                originalPrice: 229 * USD_TO_KES_RATE, // 29,541 KSh
                size: '45 m²',
                bedType: 'King Bed',
                capacity: 2,
                features: JSON.stringify(['Premium WiFi', 'Smart AC', '55" Smart TV', 'Mini Bar', 'City View', 'Coffee Machine']),
                imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: true,
                popular: true,
            },
            {
                name: 'Deluxe Garden View',
                category: 'deluxe',
                description: 'Peaceful room overlooking our beautiful gardens with a comfortable king bed and sitting area.',
                pricePerNight: 189 * USD_TO_KES_RATE, // 24,381 KSh
                originalPrice: 209 * USD_TO_KES_RATE, // 26,961 KSh
                size: '42 m²',
                bedType: 'King Bed',
                capacity: 2,
                features: JSON.stringify(['Garden View', 'Sitting Area', 'Premium Toiletries', 'Smart TV', 'Free Parking']),
                imageUrl: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: false,
            },

            // SUITES
            {
                name: 'Executive Suite',
                category: 'suites',
                description: 'Separate living and sleeping areas with a dedicated workspace. Perfect for business travelers.',
                pricePerNight: 299 * USD_TO_KES_RATE, // 38,571 KSh
                size: '65 m²',
                bedType: 'King Bed + Sofa',
                capacity: 3,
                features: JSON.stringify(['Separate Living Area', 'Work Desk', 'Kitchenette', 'Premium WiFi', 'Bathrobes', 'Evening Turndown']),
                imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: true,
                popular: true,
            },
            {
                name: 'Family Suite',
                category: 'family',
                description: 'Two connecting rooms perfect for families. Includes a king bed and two single beds.',
                pricePerNight: 329 * USD_TO_KES_RATE, // 42,441 KSh
                size: '80 m²',
                bedType: 'King + Two Singles',
                capacity: 4,
                features: JSON.stringify(['Connecting Rooms', 'Child-friendly', 'Extra Space', 'Board Games', 'Kitchenette', 'Laundry Service']),
                imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: false,
                family: true,
            },

            // PREMIUM SUITES
            {
                name: 'Presidential Suite',
                category: 'premium',
                description: 'Ultimate luxury with panoramic city views, Jacuzzi, and personalized butler service.',
                pricePerNight: 599 * USD_TO_KES_RATE, // 77,271 KSh
                size: '120 m²',
                bedType: 'Super King Bed',
                capacity: 2,
                features: JSON.stringify(['Jacuzzi Tub', 'Butler Service', 'Private Lounge', 'Gourmet Kitchen', 'Panoramic Views', 'Limo Service']),
                imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: true,
                luxury: true,
            },
            {
                name: 'Honeymoon Suite',
                category: 'premium',
                description: 'Romantic suite with rose petal turndown, champagne on arrival, and private balcony.',
                pricePerNight: 459 * USD_TO_KES_RATE, // 59,211 KSh
                size: '75 m²',
                bedType: 'Four Poster King',
                capacity: 2,
                features: JSON.stringify(['Romantic Decor', 'Champagne Service', 'Private Balcony', 'Rose Petal Turndown', 'Couples Massage Package']),
                imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: true,
                romantic: true,
            },

            // SPECIALTY ROOMS
            {
                name: 'Accessible Room',
                category: 'standard',
                description: 'Fully accessible room designed for comfort and convenience for all guests.',
                pricePerNight: 129 * USD_TO_KES_RATE, // 16,641 KSh
                size: '40 m²',
                bedType: 'Queen Bed',
                capacity: 2,
                features: JSON.stringify(['Roll-in Shower', 'Grab Bars', 'Wider Doors', 'Accessible Amenities', 'Emergency Call System']),
                imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: false,
                accessible: true,
            },
            {
                name: 'Pet-Friendly Room',
                category: 'deluxe',
                description: 'Bring your furry friend! Includes pet bed, bowls, and easy access to walking areas.',
                pricePerNight: 169 * USD_TO_KES_RATE, // 21,801 KSh
                size: '42 m²',
                bedType: 'King Bed',
                capacity: 2,
                features: JSON.stringify(['Pet Bed & Bowls', 'Easy-clean Floors', 'Pet Welcome Kit', 'Nearby Park Access', 'Pet Sitting Service']),
                imageUrl: 'https://images.unsplash.com/photo-1560184897-67f4a3f9a7fa?w=1200&auto=format&fit=crop&q=80',
                imageGallery: JSON.stringify([
                    'https://images.unsplash.com/photo-1560184897-67f4a3f9a7fa?w=1200&auto=format&fit=crop&q=80'
                ]),
                featured: false,
                petFriendly: true,
            },
        ];

        let createCount = 0;
        let updateCount = 0;
        for (const roomData of roomsData) {
            const existingRoom = await this.roomRepo.findOne({
                where: { name: roomData.name, restaurantId: restaurant.id },
            });

            if (!existingRoom) {
                const newRoom = this.roomRepo.create({
                    ...roomData,
                    restaurantId: restaurant.id,
                });
                await this.roomRepo.save(newRoom);
                createCount++;
            } else {
                await this.roomRepo.update(existingRoom.id, {
                    ...roomData,
                });
                updateCount++;
            }
        }
        if (createCount > 0) this.logger.log(`✅ Created ${createCount} new rooms`);
        if (updateCount > 0) this.logger.log(`✅ Updated ${updateCount} existing rooms`);
    }
}
