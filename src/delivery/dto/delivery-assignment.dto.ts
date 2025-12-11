// backend\src\delivery\dto\delivery-assignment.dto.ts
import { IsNumber, Min, Max } from 'class-validator';

export class DeliveryAssignmentDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  driverId: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  restaurantLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  restaurantLongitude: number;
}