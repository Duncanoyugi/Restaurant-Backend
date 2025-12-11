// backend\src\delivery\dto\create-delivery-tracking.dto.ts
import { IsNumber, IsString, IsOptional, IsDecimal, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryTrackingDto {
  @ApiProperty({ description: 'Order ID for tracking' })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: 'Driver ID assigned to delivery' })
  @IsNumber()
  driverId: number;

  @ApiProperty({ description: 'Latitude coordinate', example: 37.7749 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', example: -122.4194 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Speed in km/h', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  speed?: number;

  @ApiProperty({ description: 'Heading in degrees (0-360)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({ description: 'Distance to destination in km', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceToDestination?: number;

  @ApiProperty({ description: 'Estimated time of arrival in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  etaMinutes?: number;

  @ApiProperty({ 
    description: 'Delivery status', 
    enum: ['assigned', 'picked_up', 'on_the_way', 'nearby', 'arrived', 'delivered'],
    required: false 
  })
  @IsOptional()
  @IsString()
  status?: string;
}