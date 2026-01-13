import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusCatalog } from './entities/status-catalog.entity';

@Injectable()
export class StatusCatalogSeeder implements OnModuleInit {
  private readonly logger = new Logger(StatusCatalogSeeder.name);

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
        this.logger.error(`Error seeding status catalog: ${error.message}`);
        // Try again after a delay
        setTimeout(async () => {
          try {
            await this.seedStatusCatalog();
          } catch (retryError) {
            this.logger.error(`Error seeding status catalog on retry: ${retryError.message}`);
          }
        }, 5000);
      }
    }, 10000); // Wait for database to be ready
  }

  private async seedStatusCatalog() {
    try {
      // Check if statuses already exist
      const existingStatusesCount = await this.statusCatalogRepository.count();
      if (existingStatusesCount > 0) {
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
      let seededCount = 0;
      for (const statusData of statuses) {
        const existingStatus = await this.statusCatalogRepository.findOne({
          where: { name: statusData.name }
        });

        if (!existingStatus) {
          await this.statusCatalogRepository.save(
            this.statusCatalogRepository.create(statusData)
          );
          seededCount++;
        }
      }

      if (seededCount > 0) {
        this.logger.log(`✅ Seeded ${seededCount} order statuses`);
      }
    } catch (error) {
      this.logger.error('Error in seedStatusCatalog:', error);
      throw error;
    }
  }
}
