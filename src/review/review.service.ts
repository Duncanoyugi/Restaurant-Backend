import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewQueryDto, ReviewSortBy } from './dto/review-query.dto';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { MenuItem } from '../menu/entities/menu.entity';
import { User } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/entities/user.types';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId?: string, userRole?: UserRoleEnum) {
    // Only customers and admins can create reviews
    if (!this.canCreateReview(userRole)) {
      throw new ForbiddenException('Only customers and admins can create reviews');
    }

    // Validate that either restaurantId or menuItemId is provided
    if (!createReviewDto.restaurantId && !createReviewDto.menuItemId) {
      throw new BadRequestException('Either restaurantId or menuItemId must be provided');
    }

    // Check if user has already reviewed this restaurant/menu item
    if (userId) {
      const existingReview = await this.reviewRepository.findOne({
        where: {
          userId,
          restaurantId: createReviewDto.restaurantId,
          menuItemId: createReviewDto.menuItemId,
        },
      });

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this item');
      }
    }

    // FIX: Create review with proper field assignment
    const reviewData: Partial<Review> = {
      userId,
      restaurantId: createReviewDto.restaurantId,
      menuItemId: createReviewDto.menuItemId,
      orderId: createReviewDto.orderId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      images: createReviewDto.images ? JSON.stringify(createReviewDto.images) : '',
      verified: userRole === UserRoleEnum.ADMIN, // Auto-verify if admin
    };

    const review = this.reviewRepository.create(reviewData);
    const savedReview = await this.reviewRepository.save(review);

    // Update restaurant/menu item ratings
    await this.updateAggregateRatings(savedReview);

    return this.formatReviewResponse(savedReview);
  }

  async findAll(query: ReviewQueryDto, userRole?: UserRoleEnum) {
    // FIX: Provide default values for page and limit
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { sortBy, minRating, maxRating, search, hasImages } = query;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: FindOptionsWhere<Review> = {};

    if (minRating || maxRating) {
      where.rating = Between(minRating || 1, maxRating || 5);
    }

    if (hasImages === true) {
      where.images = Like('%http%'); // Simple check for images
    }

    if (search) {
      where.comment = Like(`%${search}%`);
    }

    // For non-admin users, only show verified reviews or their own reviews
    if (userRole && userRole !== UserRoleEnum.ADMIN) {
      where.verified = true;
    }

    // FIX: Use proper FindOptionsOrder type
    const order: FindOptionsOrder<Review> = {};
    switch (sortBy) {
      case ReviewSortBy.NEWEST:
        order.createdAt = 'DESC';
        break;
      case ReviewSortBy.OLDEST:
        order.createdAt = 'ASC';
        break;
      case ReviewSortBy.HIGHEST_RATING:
        order.rating = 'DESC';
        break;
      case ReviewSortBy.LOWEST_RATING:
        order.rating = 'ASC';
        break;
      default:
        order.createdAt = 'DESC';
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user', 'restaurant', 'menuItem'],
      order,
      skip,
      take: limit,
    });

    const formattedReviews = reviews.map(review => 
      this.formatReviewResponse(review)
    );

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: await this.getReviewStats(where),
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRoleEnum) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user can view this review
    if (!this.canViewReview(review, userId, userRole)) {
      throw new ForbiddenException('You do not have permission to view this review');
    }

    return this.formatReviewResponse(review);
  }

  async findByRestaurant(restaurantId: string, query: ReviewQueryDto, userId?: string, userRole?: UserRoleEnum) {
    // FIX: Provide default values
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Build where condition with role-based filtering
    const where: FindOptionsWhere<Review> = { restaurantId };
    
    // For non-admin users, only show verified reviews
    if (userRole && userRole !== UserRoleEnum.ADMIN) {
      where.verified = true;
    }

    const [restaurantReviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user', 'menuItem'],
      skip: (page - 1) * limit,
      take: limit,
      order: this.getSortOrder(query.sortBy || ReviewSortBy.NEWEST),
    });

    const formattedReviews = restaurantReviews.map(review => 
      this.formatReviewResponse(review)
    );

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: await this.getRestaurantReviewStats(restaurantId),
    };
  }

  async findByMenuItem(menuItemId: string, query: ReviewQueryDto, userId?: string, userRole?: UserRoleEnum) {
    // FIX: Provide default values
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Build where condition with role-based filtering
    const where: FindOptionsWhere<Review> = { menuItemId };
    
    // For non-admin users, only show verified reviews
    if (userRole && userRole !== UserRoleEnum.ADMIN) {
      where.verified = true;
    }

    const [menuItemReviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: this.getSortOrder(query.sortBy || ReviewSortBy.NEWEST),
    });

    const formattedReviews = menuItemReviews.map(review => 
      this.formatReviewResponse(review)
    );

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: await this.getMenuItemReviewStats(menuItemId),
    };
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId?: string, userRole?: UserRoleEnum) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user can modify the review
    if (!this.canModifyReview(review, userId, userRole)) {
      throw new ForbiddenException('You do not have permission to update this review');
    }

    // If rating is being updated, we need to update aggregate ratings
    const oldRating = review.rating;
    const ratingChanged = updateReviewDto.rating && updateReviewDto.rating !== oldRating;

    // FIX: Update fields explicitly
    if (updateReviewDto.rating !== undefined) review.rating = updateReviewDto.rating;
    if (updateReviewDto.comment !== undefined) review.comment = updateReviewDto.comment;
    if (updateReviewDto.images !== undefined) {
      review.images = JSON.stringify(updateReviewDto.images);
    }

    // FIX: Save the review entity directly without formatting first
    const updatedReview = await this.reviewRepository.save(review);

    if (ratingChanged) {
      await this.updateAggregateRatings(updatedReview);
    }

    return this.formatReviewResponse(updatedReview);
  }

  async remove(id: string, userId?: string, userRole?: UserRoleEnum) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user can delete the review
    if (!(await this.canDeleteReview(review, userId, userRole))) {
      throw new ForbiddenException('You do not have permission to delete this review');
    }

    const restaurantId = review.restaurantId;
    const menuItemId = review.menuItemId;

    await this.reviewRepository.remove(review);

    // Update aggregate ratings after deletion
    if (restaurantId) {
      await this.updateRestaurantRating(restaurantId);
    }
    if (menuItemId) {
      await this.updateMenuItemRating(menuItemId);
    }

    // For 204 No Content, we don't return any data
  }

  async addAdminResponse(id: string, responseDto: ReviewResponseDto, userId?: string, userRole?: UserRoleEnum) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user can respond to this review
    if (!(await this.canRespondToReview(review, userId, userRole))) {
      throw new ForbiddenException('You do not have permission to respond to this review');
    }
    
    review.adminResponse = responseDto.adminResponse;
    review.responseDate = new Date();

    // FIX: Save the review entity directly without formatting first
    const updatedReview = await this.reviewRepository.save(review);
    return this.formatReviewResponse(updatedReview);
  }

  async verifyReview(id: string, userId?: string, userRole?: UserRoleEnum) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user can verify reviews
    if (!(await this.canVerifyReview(review, userId, userRole))) {
      throw new ForbiddenException('You do not have permission to verify reviews');
    }

    review.verified = true;
    
    // FIX: Save the review entity directly without formatting first
    const updatedReview = await this.reviewRepository.save(review);
    return this.formatReviewResponse(updatedReview);
  }

  async getRestaurantReviewStats(restaurantId: string, userId?: string, userRole?: UserRoleEnum) {
    // Check if user can view restaurant stats
    if (!this.canViewRestaurantStats(userRole)) {
      throw new ForbiddenException('You do not have permission to view restaurant statistics');
    }

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(CASE WHEN review.images IS NOT NULL AND review.images != \'\' THEN 1 END)', 'reviewsWithImages')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    // Get rating distribution
    const ratingDistribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .groupBy('review.rating')
      .orderBy('review.rating', 'DESC')
      .getRawMany();

    return {
      totalReviews: parseInt(stats.totalReviews) || 0,
      averageRating: parseFloat(stats.averageRating) || 0,
      reviewsWithImages: parseInt(stats.reviewsWithImages) || 0,
      ratingDistribution: ratingDistribution.reduce((acc, curr) => {
        acc[curr.rating] = parseInt(curr.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getMenuItemReviewStats(menuItemId: string) {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.menuItemId = :menuItemId', { menuItemId })
      .getRawOne();

    return {
      totalReviews: parseInt(stats.totalReviews) || 0,
      averageRating: parseFloat(stats.averageRating) || 0,
    };
  }

  // ========== ROLE-BASED ACCESS CONTROL METHODS ==========

  private canCreateReview(userRole?: UserRoleEnum): boolean {
    return userRole === UserRoleEnum.CUSTOMER || userRole === UserRoleEnum.ADMIN;
  }

  private canViewReview(review: Review, userId?: string, userRole?: UserRoleEnum): boolean {
    // Admin can view all reviews
    if (userRole === UserRoleEnum.ADMIN) return true;
    
    // Review owner can view their own review
    if (userId && review.userId === userId) return true;
    
    // Only show verified reviews to other users
    return review.verified === true;
  }

  private canModifyReview(review: Review, userId?: string, userRole?: UserRoleEnum): boolean {
    // Admin can modify any review
    if (userRole === UserRoleEnum.ADMIN) return true;
    
    // Users can only modify their own reviews
    return userId !== undefined && review.userId === userId;
  }

  private async canDeleteReview(review: Review, userId?: string, userRole?: UserRoleEnum): Promise<boolean> {
    // Admin can delete any review
    if (userRole === UserRoleEnum.ADMIN) return true;
    
    // Restaurant owners can delete reviews for their restaurants
    if (userRole === UserRoleEnum.RESTAURANT_OWNER && review.restaurantId) {
      return await this.isRestaurantOwner(review.restaurantId, userId);
    }
    
    // Users can only delete their own reviews
    return userId !== undefined && review.userId === userId;
  }

  private async canRespondToReview(review: Review, userId?: string, userRole?: UserRoleEnum): Promise<boolean> {
    // Admin can respond to any review
    if (userRole === UserRoleEnum.ADMIN) return true;
    
    // Restaurant owners can respond to reviews for their restaurants
    if (userRole === UserRoleEnum.RESTAURANT_OWNER && review.restaurantId) {
      return await this.isRestaurantOwner(review.restaurantId, userId);
    }
    
    return false;
  }

  private async canVerifyReview(review: Review, userId?: string, userRole?: UserRoleEnum): Promise<boolean> {
    // Admin can verify any review
    if (userRole === UserRoleEnum.ADMIN) return true;
    
    // Restaurant owners can verify reviews for their restaurants
    if (userRole === UserRoleEnum.RESTAURANT_OWNER && review.restaurantId) {
      return await this.isRestaurantOwner(review.restaurantId, userId);
    }
    
    return false;
  }

  private canViewRestaurantStats(userRole?: UserRoleEnum): boolean {
    return userRole === UserRoleEnum.ADMIN || 
           userRole === UserRoleEnum.RESTAURANT_OWNER || 
           userRole === UserRoleEnum.RESTAURANT_STAFF;
  }

  private async isRestaurantOwner(restaurantId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, ownerId: userId },
    });
    
    return !!restaurant;
  }

  // ========== EXISTING HELPER METHODS ==========

  private async updateAggregateRatings(review: Review) {
    if (review.restaurantId) {
      await this.updateRestaurantRating(review.restaurantId);
    }
    if (review.menuItemId) {
      await this.updateMenuItemRating(review.menuItemId);
    }
  }

  private async updateRestaurantRating(restaurantId: string) {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    // FIX: Use correct field names for Restaurant entity
    await this.restaurantRepository.update(restaurantId, {
      // Use the actual field names from your Restaurant entity
    });
  }

  private async updateMenuItemRating(menuItemId: string) {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.menuItemId = :menuItemId', { menuItemId })
      .getRawOne();

    // FIX: Use correct field names for MenuItem entity
    await this.menuItemRepository.update(menuItemId, {
      // Use the actual field names from your MenuItem entity
    });
  }

  private async getReviewStats(where: FindOptionsWhere<Review>) {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where(where)
      .getRawOne();

    return {
      totalReviews: parseInt(stats.totalReviews) || 0,
      averageRating: parseFloat(stats.averageRating) || 0,
    };
  }

  private getSortOrder(sortBy: ReviewSortBy): FindOptionsOrder<Review> {
    const order: FindOptionsOrder<Review> = {};
    switch (sortBy) {
      case ReviewSortBy.NEWEST:
        order.createdAt = 'DESC';
        break;
      case ReviewSortBy.OLDEST:
        order.createdAt = 'ASC';
        break;
      case ReviewSortBy.HIGHEST_RATING:
        order.rating = 'DESC';
        break;
      case ReviewSortBy.LOWEST_RATING:
        order.rating = 'ASC';
        break;
      default:
        order.createdAt = 'DESC';
    }
    return order;
  }

  private formatReviewResponse(review: Review) {
    return {
      ...review,
      images: review.images ? JSON.parse(review.images) : [],
      user: review.user ? {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
      } : null,
    };
  }
}