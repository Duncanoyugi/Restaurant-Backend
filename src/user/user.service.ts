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
  // CREATE USER (REGISTER)
  // -----------------------------------------------------
  async create(dto: CreateUserDto, roleName: string = 'Customer'): Promise<User> {
    // Check if email exists
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException(`User with email ${dto.email} already exists`);
    }

    // Fetch role
    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user entity
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      role,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
      active: true,
    });

    return this.userRepository.save(user);
  }

  // -----------------------------------------------------
  // FIND ALL USERS
  // -----------------------------------------------------
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
    });
  }

  // -----------------------------------------------------
  // FIND USER BY ID
  // -----------------------------------------------------
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
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
  // FIND USER BY EMAIL WITH PASSWORD (FOR LOGIN)
  // -----------------------------------------------------
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        emailVerified: true,
        status: true,
        roleId: true,
        role: {
          id: true,
          name: true,
          description: true,
        },
      },
      relations: ['role'],
    });
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

    // Hash password if updating
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
