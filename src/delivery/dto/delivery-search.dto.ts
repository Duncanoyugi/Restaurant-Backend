// backend\src\delivery\dto\delivery-search.dto.ts
import { IsOptional, IsString, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DeliverySearchDto {
  @ApiProperty({ description: 'Order ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderId?: number;

  @ApiProperty({ description: 'Driver ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  driverId?: number;

  @ApiProperty({ 
    description: 'Status filter', 
    enum: ['assigned', 'picked_up', 'on_the_way', 'nearby', 'arrived', 'delivered'],
    required: false 
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Start date for filtering', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for filtering', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}