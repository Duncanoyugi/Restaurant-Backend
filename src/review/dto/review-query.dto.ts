import { IsOptional, IsNumber, IsString, IsEnum, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReviewSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST_RATING = 'highest_rating',
  LOWEST_RATING = 'lowest_rating',
  MOST_HELPFUL = 'most_helpful'
}

export class ReviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.NEWEST;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  hasImages?: boolean;
}