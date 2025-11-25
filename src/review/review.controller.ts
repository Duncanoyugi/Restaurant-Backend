// backend\src\review\review.controller.ts
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
  ParseUUIDPipe
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// FIX: Import from the correct location
import { UserRoleEnum } from '../user/entities/user.types';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewService.create(createReviewDto, req.user.id);
  }

  @Get()
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.findAll(query);
  }

  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findByRestaurant(restaurantId, query);
  }

  @Get('menu-item/:menuItemId')
  async findByMenuItem(
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findByMenuItem(menuItemId, query);
  }

  @Get('stats/restaurant/:restaurantId')
  async getRestaurantStats(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.reviewService.getRestaurantReviewStats(restaurantId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.reviewService.remove(id, req.user.id);
  }

  @Post(':id/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  async addAdminResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() responseDto: ReviewResponseDto,
  ) {
    return this.reviewService.addAdminResponse(id, responseDto);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.RESTAURANT_OWNER)
  async verifyReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.verifyReview(id);
  }
}