import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu.entity';
import { Category } from './entities/category.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Injectable()
export class MenuSeeder implements OnModuleInit {
    private readonly logger = new Logger(MenuSeeder.name);

    constructor(
        @InjectRepository(MenuItem)
        private menuItemRepo: Repository<MenuItem>,
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(Restaurant)
        private restaurantRepo: Repository<Restaurant>,
    ) { }

    async onModuleInit() {
        // Wait for restaurant to be seeded
        setTimeout(async () => {
            try {
                await this.seedMenu();
            } catch (error) {
                this.logger.error(`Error seeding menu: ${error.message}`);
                setTimeout(async () => {
                    try {
                        await this.seedMenu();
                    } catch (retryError) {
                        this.logger.error(`Error seeding menu on retry: ${retryError.message}`);
                    }
                }, 20000);
            }
        }, 15000); // Wait longer than restaurant seeder
    }

    private async seedMenu() {
        const restaurant = await this.restaurantRepo.findOne({
            where: { email: 'info@thegrandrestaurant.co.ke' },
        });

        if (!restaurant) {
            this.logger.error('Default restaurant not found. Cannot seed menu.');
            return;
        }

        const categories = [
            {
                name: 'Appetizers',
                description: 'Starters to whet your appetite',
                sortOrder: 1,
            },
            {
                name: 'Salads & Bowls',
                description: 'Fresh and healthy options',
                sortOrder: 2,
            },
            {
                name: 'Main Courses',
                description: 'Hearty meals for the main event',
                sortOrder: 3,
            },
            {
                name: 'Desserts',
                description: 'Sweet treats to finish your meal',
                sortOrder: 4,
            },
            {
                name: 'Drinks',
                description: 'Refreshing beverages',
                sortOrder: 5,
            }
        ];

        const savedCategories: { [key: string]: Category } = {};

        // Seed Categories
        let catCount = 0;
        for (const catData of categories) {
            let category = await this.categoryRepo.findOne({
                where: { name: catData.name, restaurantId: restaurant.id },
            });

            if (!category) {
                category = this.categoryRepo.create({
                    ...catData,
                    restaurantId: restaurant.id,
                });
                await this.categoryRepo.save(category);
                catCount++;
            }
            savedCategories[category.name] = category;
        }
        if (catCount > 0) this.logger.log(`✅ Seeded ${catCount} menu categories`);

        // Seed Menu Items
        const menuItems = [
            {
                name: 'Tomato Basil Bruschetta',
                description: 'Toasted bread topped with fresh tomato and basil, drizzled with olive oil.',
                ingredients: 'Bread, Tomato, Basil, Olive Oil',
                price: 1450,
                imageUrl: 'https://images.unsplash.com/photo-1527751171053-6ac5ec50000b?w=1400&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: false,
                averageRating: 4.5,
                totalReviews: 12,
                preparationTime: 15,
                allergens: JSON.stringify(['Gluten']),
                categoryName: 'Appetizers'
            },
            {
                name: 'Mixed Bites Plate',
                description: 'Several appetizer pieces on one plate — crunchy, fresh, and ready to enjoy.',
                ingredients: 'Assorted appetizers',
                price: 1850,
                imageUrl: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=1400&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: true,
                averageRating: 4.8,
                totalReviews: 24,
                preparationTime: 20,
                allergens: JSON.stringify(['Gluten', 'Dairy']),
                categoryName: 'Appetizers'
            },
            {
                name: 'Mediterranean Salad',
                description: 'Fresh greens, olives, feta, cucumber, and tomato with lemon-herb vinaigrette.',
                ingredients: 'Lettuce, Olives, Feta Cheese, Cucumber, Tomato',
                price: 1250,
                imageUrl: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=800&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: false,
                averageRating: 4.6,
                totalReviews: 18,
                preparationTime: 10,
                allergens: JSON.stringify(['Dairy']),
                categoryName: 'Salads & Bowls'
            },
            {
                name: 'Grilled Steak',
                description: 'Premium cut steak grilled to perfection, served with roasted vegetables.',
                ingredients: 'Beef Steak, Seasonal Vegetables',
                price: 3500,
                imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1400&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: true,
                averageRating: 4.9,
                totalReviews: 45,
                preparationTime: 30,
                allergens: JSON.stringify([]),
                categoryName: 'Main Courses'
            },
            {
                name: 'Salmon Fillet',
                description: 'Fresh salmon fillet pan-seared with herbs and lemon butter sauce.',
                ingredients: 'Salmon, Lemon, Herbs, Butter',
                price: 2950,
                imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=1400&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: false,
                averageRating: 4.7,
                totalReviews: 32,
                preparationTime: 25,
                allergens: JSON.stringify(['Fish', 'Dairy']),
                categoryName: 'Main Courses'
            },
            {
                name: 'Chocolate Lava Cake',
                description: 'Decadent chocolate cake with a molten center.',
                ingredients: 'Chocolate, Flour, Sugar, Eggs',
                price: 950,
                imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=1400&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: true,
                averageRating: 4.9,
                totalReviews: 50,
                preparationTime: 15,
                allergens: JSON.stringify(['Gluten', 'Dairy', 'Eggs']),
                categoryName: 'Desserts'
            },
            {
                name: 'Fresh Lemonade',
                description: 'Classic freshly squeezed lemonade.',
                ingredients: 'Lemon, Sugar, Water, Mint',
                price: 450,
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1400&auto=format&fit=crop&q=60',
                available: true,
                isFeatured: false,
                averageRating: 4.5,
                totalReviews: 20,
                preparationTime: 5,
                allergens: JSON.stringify([]),
                categoryName: 'Drinks'
            }
        ];

        let itemCount = 0;
        let updateCount = 0;
        for (const itemData of menuItems) {
            const category = savedCategories[itemData.categoryName];
            if (!category) {
                this.logger.warn(`Category not found for item: ${itemData.name} (${itemData.categoryName})`);
                continue;
            }

            const { categoryName, ...data } = itemData;

            let menuItem = await this.menuItemRepo.findOne({
                where: { name: data.name, restaurantId: restaurant.id },
            });

            if (!menuItem) {
                menuItem = this.menuItemRepo.create({
                    ...data,
                    restaurantId: restaurant.id,
                    categoryId: category.id,
                });
                await this.menuItemRepo.save(menuItem);
                itemCount++;
            } else {
                await this.menuItemRepo.update(menuItem.id, {
                    ...data,
                    categoryId: category.id
                });
                updateCount++;
            }
        }
        if (itemCount > 0) this.logger.log(`✅ Created ${itemCount} new menu items`);
        if (updateCount > 0) this.logger.log(`✅ Updated ${updateCount} existing menu items`);
    }
}
