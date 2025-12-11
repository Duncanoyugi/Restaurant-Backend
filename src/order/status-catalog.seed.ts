import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusCatalog } from './entities/status-catalog.entity';

@Injectable()
export class StatusCatalogSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(StatusCatalog)
    private statusCatalogRepository: Repository<StatusCatalog>,
  ) {}

  async onModuleInit() {
    // Delay to ensure database is ready
    setTimeout(async () => {
      try {
        await this.seedStatusCatalog();
      } catch (error) {
        console.error('Error seeding status catalog:', error.message);
        // Try again after a delay
        setTimeout(async () => {
          try {
            await this.seedStatusCatalog();
          } catch (retryError) {
            console.error('Error seeding status catalog on retry:', retryError.message);
          }
        }, 5000);
      }
    }, 10000); // Wait for database to be ready
  }

  private async seedStatusCatalog() {
    try {
      // Check if statuses already exist
      const existingStatuses = await this.statusCatalogRepository.find();
      if (existingStatuses.length > 0) {
        console.log('✅ Status catalog already seeded');
        return;
      }

      // Define the order statuses that should exist
      const statuses = [
        {
          name: 'Pending',
          description: 'Order has been created but not yet processed',
          color: '#FFA500' // Orange
        },
        {
          name: 'Preparing',
          description: 'Order is being prepared in the kitchen',
          color: '#FFD700' // Gold
        },
        {
          name: 'Ready',
          description: 'Order is ready for pickup or delivery',
          color: '#32CD32' // Lime green
        },
        {
          name: 'Out for Delivery',
          description: 'Order is out for delivery',
          color: '#1E90FF' // Dodger blue
        },
        {
          name: 'Delivered',
          description: 'Order has been delivered to customer',
          color: '#228B22' // Forest green
        },
        {
          name: 'Completed',
          description: 'Order has been completed',
          color: '#006400' // Dark green
        },
        {
          name: 'Cancelled',
          description: 'Order has been cancelled',
          color: '#DC143C' // Crimson
        }
      ];

      // Seed the statuses
      for (const statusData of statuses) {
        const existingStatus = await this.statusCatalogRepository.findOne({
          where: { name: statusData.name }
        });

        if (!existingStatus) {
          await this.statusCatalogRepository.save(
            this.statusCatalogRepository.create(statusData)
          );
          console.log(`✅ Seeded status: ${statusData.name}`);
        }
      }

      console.log('✅ Status catalog seeding completed');
    } catch (error) {
      console.error('Error in seedStatusCatalog:', error);
      throw error;
    }
  }
}