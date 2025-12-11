// backend\src\delivery\dto\delivery-estimate.dto.ts
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class DeliveryEstimateDto {
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  restaurantLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  restaurantLongitude: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  customerLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  customerLongitude: number;
}