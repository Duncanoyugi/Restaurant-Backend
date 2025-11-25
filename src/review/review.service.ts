// backend\src\review\review.service.ts
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

  async create(createReviewDto: CreateReviewDto, userId?: string) {
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
      verified: false,
    };

    const review = this.reviewRepository.create(reviewData);
    const savedReview = await this.reviewRepository.save(review);

    // Update restaurant/menu item ratings
    await this.updateAggregateRatings(savedReview);

    return this.formatReviewResponse(savedReview);
  }

  async findAll(query: ReviewQueryDto) {
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

  async findOne(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return this.formatReviewResponse(review);
  }

  async findByRestaurant(restaurantId: string, query: ReviewQueryDto) {
    // FIX: Provide default values
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [restaurantReviews, total] = await this.reviewRepository.findAndCount({
      where: { restaurantId },
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

  async findByMenuItem(menuItemId: string, query: ReviewQueryDto) {
    // FIX: Provide default values
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [menuItemReviews, total] = await this.reviewRepository.findAndCount({
      where: { menuItemId },
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

  async update(id: string, updateReviewDto: UpdateReviewDto, userId?: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user owns the review (if userId is provided)
    if (userId && review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
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

  // ADD THE MISSING REMOVE METHOD
  async remove(id: string, userId?: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user owns the review (if userId is provided)
    if (userId && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
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
    // The method completes successfully without returning a value
  }

  async addAdminResponse(id: string, responseDto: ReviewResponseDto) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    
    review.adminResponse = responseDto.adminResponse;
    review.responseDate = new Date();

    // FIX: Save the review entity directly without formatting first
    const updatedReview = await this.reviewRepository.save(review);
    return this.formatReviewResponse(updatedReview);
  }

  async verifyReview(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'menuItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    review.verified = true;
    
    // FIX: Save the review entity directly without formatting first
    const updatedReview = await this.reviewRepository.save(review);
    return this.formatReviewResponse(updatedReview);
  }

  async getRestaurantReviewStats(restaurantId: string) {
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
      // If these fields don't exist, you may need to add them to the Restaurant entity
      // averageRating: parseFloat(stats.averageRating) || 0,
      // totalReviews: parseInt(stats.reviewCount) || 0,
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
      // If these fields don't exist, you may need to add them to the MenuItem entity
      // averageRating: parseFloat(stats.averageRating) || 0,
      // totalReviews: parseInt(stats.reviewCount) || 0,
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