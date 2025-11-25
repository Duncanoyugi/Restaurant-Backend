import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { UserRoleEnum } from './entities/user.types';

@Injectable()
export class RoleSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UserRole)
    private roleRepo: Repository<UserRole>,
  ) {}

  async onApplicationBootstrap() {
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
  }
}
