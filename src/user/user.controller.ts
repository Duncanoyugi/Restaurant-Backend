import {
   Controller,
   Get,
   Post,
   Body,
   Patch,
   Param,
   Delete,
   Query,
   Put,
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
  @Roles(UserRoleEnum.ADMIN)
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

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user retrieved successfully' })
  getMe(@Req() req: any) {
    return this.userService.getCurrentUserProfile(req.user.sub ?? req.user.id);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile retrieved successfully' })
  getMyProfile(@Req() req: any) {
    return this.userService.getCurrentUserProfile(req.user.sub ?? req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user' })
  @ApiResponse({ status: 200, description: 'Current user updated successfully' })
  @ApiBody({ type: UpdateUserDto })
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateCurrentUserProfile(req.user.sub ?? req.user.id, dto);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile updated successfully' })
  @ApiBody({ type: UpdateUserDto })
  updateMyProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateCurrentUserProfile(req.user.sub ?? req.user.id, dto);
  }

  @Patch('me/online-status')
  @ApiOperation({ summary: 'Update current user online status' })
  @ApiResponse({ status: 200, description: 'Online status updated successfully' })
  updateMyOnlineStatus(@Req() req: any, @Body('isOnline') isOnline: boolean) {
    return this.userService.updateOnlineStatus(req.user.sub ?? req.user.id, isOnline);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  changeMyPassword(
    @Req() req: any,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.userService.changePassword(req.user.sub ?? req.user.id, currentPassword, newPassword);
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

  @Get('statistics')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  getStatistics() {
    return this.userService.getStatistics();
  }

  @Get('online')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get online users' })
  @ApiResponse({ status: 200, description: 'Online users retrieved successfully' })
  getOnlineUsers() {
    return this.userService.findOnlineUsers();
  }

  @Get('search')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Users searched successfully' })
  searchUsers(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.userService.searchUsers(q || '', limit ? parseInt(limit, 10) : 10);
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Check whether an email exists' })
  @ApiResponse({ status: 200, description: 'Email existence checked successfully' })
  checkEmail(@Query('email') email: string) {
    return this.userService.checkEmailExists(email);
  }

  @Get('check-phone')
  @ApiOperation({ summary: 'Check whether a phone exists' })
  @ApiResponse({ status: 200, description: 'Phone existence checked successfully' })
  checkPhone(@Query('phone') phone: string) {
    return this.userService.checkPhoneExists(phone);
  }

  @Get('find-by-email')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  async findByEmailQuery(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Get('find-by-phone')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Find user by phone' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  async findByPhoneQuery(@Query('phone') phone: string) {
    return this.userService.findByPhone(phone);
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN)
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
