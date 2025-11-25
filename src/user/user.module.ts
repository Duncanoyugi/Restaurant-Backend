import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { RoleSeeder } from './role.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole])],
  controllers: [UserController],
  providers: [UserService, RoleSeeder],
  exports: [UserService], 
})
export class UserModule {}
