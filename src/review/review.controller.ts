import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseIntPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.types';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoleEnum.CUSTOMER, UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateReviewDto })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewService.create(createReviewDto, req.user.id);
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get all reviews with filtering' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiQuery({ type: ReviewQueryDto })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.findAll(query);
  }

  @Get('restaurant/:restaurantId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get reviews by restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: String })
  @ApiQuery({ type: ReviewQueryDto })
  async findByRestaurant(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findByRestaurant(restaurantId, query);
  }

  @Get('menu-item/:menuItemId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get reviews by menu item' })
  @ApiResponse({ status: 200, description: 'Menu item reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiParam({ name: 'menuItemId', description: 'Menu item ID', type: Number })
  @ApiQuery({ type: ReviewQueryDto })
  async findByMenuItem(
    @Param('menuItemId', ParseIntPipe) menuItemId: number,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findByMenuItem(menuItemId, query);
  }

  @Get('stats/restaurant/:restaurantId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF)
  @ApiOperation({ summary: 'Get restaurant review statistics' })
  @ApiResponse({ status: 200, description: 'Review statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  async getRestaurantStats(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.reviewService.getRestaurantReviewStats(restaurantId);
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER, UserRoleEnum.RESTAURANT_STAFF, UserRoleEnum.CUSTOMER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoleEnum.CUSTOMER, UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update review by ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  @ApiBody({ type: UpdateReviewDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoleEnum.CUSTOMER, UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete review by ID' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only delete own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.reviewService.remove(id, req.user.id);
  }

  @Post(':id/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add admin/owner response to review' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  @ApiBody({ type: ReviewResponseDto })
  async addAdminResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() responseDto: ReviewResponseDto,
  ) {
    return this.reviewService.addAdminResponse(id, responseDto);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify review (Admin/Restaurant Owner only)' })
  @ApiResponse({ status: 200, description: 'Review verified successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Restaurant Owner access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  async verifyReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.verifyReview(id);
  }
}