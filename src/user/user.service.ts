// backend/src/user/user.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserRole)
    private readonly roleRepository: Repository<UserRole>,
  ) {}

  // -----------------------------------------------------
  // CREATE USER (REGISTER) - FIXED (NO MANUAL HASHING)
  // -----------------------------------------------------
  async create(dto: CreateUserDto, roleName: string = 'Customer'): Promise<User> {
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException(`User with email ${dto.email} already exists`);
    }

    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    // ❗ Do NOT hash here — entity hashes automatically via @BeforeInsert()
    const user = this.userRepository.create({
      ...dto,
      password: dto.password, // keep plain — entity will hash
      role,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
      active: true,
    });

    return this.userRepository.save(user); // hash happens in entity
  }

  // -----------------------------------------------------
  // FIND ALL USERS
  // -----------------------------------------------------
  async findAll(options?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
    emailVerified?: boolean;
    isOnline?: boolean;
    isAvailable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deleted_at IS NULL');

    if (options?.name) {
      queryBuilder.andWhere('user.name ILIKE :name', { name: `%${options.name}%` });
    }

    if (options?.email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${options.email}%` });
    }

    if (options?.phone) {
      queryBuilder.andWhere('user.phone ILIKE :phone', { phone: `%${options.phone}%` });
    }

    if (options?.role) {
      queryBuilder.andWhere('role.name = :role', { role: options.role });
    }

    if (options?.status) {
      queryBuilder.andWhere('user.status = :status', { status: options.status });
    }

    if (options?.emailVerified !== undefined) {
      queryBuilder.andWhere('user.emailVerified = :emailVerified', { emailVerified: options.emailVerified });
    }

    if (options?.isOnline !== undefined) {
      queryBuilder.andWhere('user.isOnline = :isOnline', { isOnline: options.isOnline });
    }

    if (options?.isAvailable !== undefined) {
      queryBuilder.andWhere('user.isAvailable = :isAvailable', { isAvailable: options.isAvailable });
    }

    if (options?.page && options?.limit) {
      queryBuilder
        .skip((options.page - 1) * options.limit)
        .take(options.limit);
    } else if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return queryBuilder.getMany();
  }

  // -----------------------------------------------------
  // FIND USER BY ID
  // -----------------------------------------------------
  async findById(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }

  // -----------------------------------------------------
  // FIND USER BY EMAIL
  // -----------------------------------------------------
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  // -----------------------------------------------------
  // FIND USER INCLUDING PASSWORD (FOR LOGIN)
  // -----------------------------------------------------
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect('user.password') // explicitly include password
      .where('user.email = :email', { email })
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }

  // -----------------------------------------------------
  // VALIDATE PASSWORD
  // -----------------------------------------------------
  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // -----------------------------------------------------
  // UPDATE USER
  // -----------------------------------------------------
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    // Hash ONLY on update because entity has no @BeforeUpdate()
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepository.update(id, dto);

    const updatedUser = await this.findById(id);
    if (!updatedUser) throw new NotFoundException(`User with id ${id} not found after update`);

    return updatedUser;
  }

  // -----------------------------------------------------
  // DELETE USER
  // -----------------------------------------------------
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    await this.userRepository.delete(id);
  }
}
