// backend/src/user/user.service.ts
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
    const existingEmail = await this.findByEmail(dto.email);
    if (existingEmail) {
      throw new BadRequestException(`User with email ${dto.email} already exists`);
    }

    const existingPhone = await this.findByPhone(dto.phone);
    if (existingPhone) {
      throw new BadRequestException(`User with phone number ${dto.phone} already exists`);
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
  }): Promise<{ data: User[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deleted_at IS NULL');

    if (options?.name) {
      queryBuilder.andWhere('LOWER(user.name) LIKE LOWER(:name)', { name: `%${options.name}%` });
    }

    if (options?.email) {
      queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', { email: `%${options.email}%` });
    }

    if (options?.phone) {
      queryBuilder.andWhere('LOWER(user.phone) LIKE LOWER(:phone)', { phone: `%${options.phone}%` });
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

    const page = options?.page || 1;
    const limit = options?.limit || 10;

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit);

    const data = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // -----------------------------------------------------
  // FIND USER BY ID
  // -----------------------------------------------------
  async findById(id: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id: String(id) })
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
  // FIND USER BY PHONE
  // -----------------------------------------------------
  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone },
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
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    // Hash ONLY on update because entity has no @BeforeUpdate()
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepository.update(String(id), dto);

    const updatedUser = await this.findById(Number(id));
    if (!updatedUser) throw new NotFoundException(`User with id ${id} not found after update`);

    return updatedUser;
  }

  // -----------------------------------------------------
  // DELETE USER
  // -----------------------------------------------------
  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    await this.userRepository.delete(String(id));
  }

  async getStatistics() {
    const [totalUsers, activeUsers, onlineUsers, verifiedUsers] = await Promise.all([
      this.userRepository.count({ where: { deletedAt: null as any } }),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE, deletedAt: null as any } }),
      this.userRepository.count({ where: { isOnline: true, deletedAt: null as any } }),
      this.userRepository.count({ where: { emailVerified: true, deletedAt: null as any } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      onlineUsers,
      verifiedUsers,
      inactiveUsers: Math.max(totalUsers - activeUsers, 0),
    };
  }

  async findOnlineUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { isOnline: true, deletedAt: null as any },
      relations: ['role'],
    });
  }

  async searchUsers(query: string, limit = 10): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deleted_at IS NULL')
      .andWhere(
        '(LOWER(user.name) LIKE LOWER(:query) OR LOWER(user.email) LIKE LOWER(:query) OR LOWER(user.phone) LIKE LOWER(:query))',
        { query: `%${query}%` },
      )
      .take(limit)
      .getMany();
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const user = await this.findByEmail(email);
    return { exists: !!user };
  }

  async checkPhoneExists(phone: string): Promise<{ exists: boolean }> {
    const user = await this.findByPhone(phone);
    return { exists: !!user };
  }

  async getCurrentUserProfile(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUserProfile(userId: number, dto: UpdateUserDto): Promise<User> {
    return this.update(userId, dto);
  }

  async updateOnlineStatus(userId: number, isOnline: boolean): Promise<User> {
    return this.update(userId, { isOnline } as any);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.findByEmailWithPassword((await this.getCurrentUserProfile(userId)).email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.update(userId, { password: newPassword });

    return { message: 'Password changed successfully' };
  }
}
