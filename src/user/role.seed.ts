import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { UserRoleEnum } from './entities/user.types';

@Injectable()
export class RoleSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(UserRole)
    private roleRepo: Repository<UserRole>,
  ) { }

  async onModuleInit() {
    try {
      const roles = Object.values(UserRoleEnum);

      for (const roleName of roles) {
        const exists = await this.roleRepo.findOne({ where: { name: roleName } });
        if (!exists) {
          await this.roleRepo.save(
            this.roleRepo.create({
              name: roleName,
              description: `${roleName} role`,
              permissions: JSON.stringify([]),
            }),
          );
          console.log(`Seeded role: ${roleName}`);
        }
      }
    } catch (error) {
      console.error('Error seeding roles:', error.message);
      // Try again after a delay
      setTimeout(() => {
        this.seedRoles();
      }, 5000);
    }
  }

  private async seedRoles() {
    try {
      const roles = Object.values(UserRoleEnum);

      for (const roleName of roles) {
        const exists = await this.roleRepo.findOne({ where: { name: roleName } });
        if (!exists) {
          await this.roleRepo.save(
            this.roleRepo.create({
              name: roleName,
              description: `${roleName} role`,
              permissions: JSON.stringify([]),
            }),
          );
          console.log(`Seeded role: ${roleName}`);
        }
      }
    } catch (error) {
      console.error('Error seeding roles on retry:', error.message);
    }
  }
}
