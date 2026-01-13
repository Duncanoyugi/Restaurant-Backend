import {
   Controller,
   Get,
   Post,
   Body,
   Patch,
   Param,
   Delete,
   Query,
   UseInterceptors,
   ClassSerializerInterceptor,
   UseGuards,
   Req
 } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRoleEnum } from './entities/user.types';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('emailVerified') emailVerified?: string,
    @Query('isOnline') isOnline?: string,
    @Query('isAvailable') isAvailable?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll({
      name,
      email,
      phone,
      role,
      status,
      emailVerified: emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined,
      isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // IMPORTANT: Specific routes like 'me/*' must come BEFORE parameterized routes like ':id'
  @Get('me/dashboard')
  @ApiOperation({ summary: 'Get current user dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getMyDashboard(@Req() req: any) {
    return {
      user: req.user,
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get('me/loyalty')
  @ApiOperation({ summary: 'Get current user loyalty program information' })
  @ApiResponse({ status: 200, description: 'Loyalty information retrieved successfully' })
  getMyLoyalty(@Req() req: any) {
    // Return default loyalty program data
    // This can be expanded later with actual loyalty program implementation
    return {
      points: 0,
      tier: 'Silver',
      pointsNeeded: 500,
      nextTier: 'Gold',
      totalSpent: 0,
      totalOrders: 0,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  findOne(@Param('id') id: string) {
    return this.userService.findById(parseInt(id));
  }

  @Patch(':id')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({ type: UpdateUserDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  remove(@Param('id') id: string) {
    return this.userService.remove(parseInt(id));
  }

}