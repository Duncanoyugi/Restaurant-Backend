import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { City } from '../location/entities/city.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class RestaurantSeeder implements OnModuleInit {
    private readonly logger = new Logger(RestaurantSeeder.name);

    constructor(
        @InjectRepository(Restaurant)
        private restaurantRepo: Repository<Restaurant>,
        @InjectRepository(City)
        private cityRepo: Repository<City>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async onModuleInit() {
        // Wait for database and entities to be fully ready
        setTimeout(async () => {
            try {
                await this.seedDefaultRestaurant();
            } catch (error) {
                this.logger.error(`Error seeding default restaurant: ${error.message}`);
                // Try again after a longer delay
                setTimeout(async () => {
                    try {
                        await this.seedDefaultRestaurant();
                    } catch (retryError) {
                        this.logger.error(`Error seeding default restaurant on retry: ${retryError.message}`);
                    }
                }, 15000);
            }
        }, 12000); // Delay to ensure locations are seeded first
    }

    private async seedDefaultRestaurant() {
        try {
            // Check if default restaurant already exists
            const existingRestaurant = await this.restaurantRepo.findOne({
                where: { email: 'info@thegrandrestaurant.co.ke' }
            });

            if (existingRestaurant) {
                return;
            }

            // Get Nairobi CBD city
            const nairobiCBD = await this.cityRepo.findOne({
                where: { name: 'CBD' },
                relations: ['state']
            });

            if (!nairobiCBD) {
                this.logger.error('Nairobi CBD city not found. Cannot seed default restaurant.');
                return;
            }

            // Find or create a default owner (admin user)
            let owner = await this.userRepo.findOne({
                where: { email: 'admin@thegrandrestaurant.co.ke' }
            });

            if (!owner) {
                // Get any user to be the owner (first user in the system)
                const users = await this.userRepo.find({ take: 1 });
                owner = users[0];
            }

            if (!owner) {
                this.logger.error('No owner user found. Cannot seed default restaurant.');
                return;
            }

            // Create default restaurant
            const defaultRestaurant = this.restaurantRepo.create({
                name: 'The Grand Restaurant',
                description: 'Experience fine dining at its best. Our restaurant offers a perfect blend of traditional and contemporary cuisine, crafted with the finest ingredients and served in an elegant atmosphere.',
                email: 'info@thegrandrestaurant.co.ke',
                phone: '+254712345678',
                streetAddress: 'Kenyatta Avenue, City Square Building',
                zipCode: '00100',
                cityId: nairobiCBD.id,
                ownerId: owner.id,
                latitude: -1.2864,
                longitude: 36.8172,
                logoUrl: '/images/restaurant-logo.png',
                coverImageUrl: '/images/restaurant-hall.jpg',
                openingTime: '08:00:00',
                closingTime: '23:00:00',
                active: true,
                averageRating: 4.5,
            });

            await this.restaurantRepo.save(defaultRestaurant);
            this.logger.log('✅ Seeded default restaurant: The Grand Restaurant');
        } catch (error) {
            this.logger.error('Error in seedDefaultRestaurant:', error);
            throw error;
        }
    }
}
