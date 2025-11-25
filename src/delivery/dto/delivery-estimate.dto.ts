import { IsNumber, IsNotEmpty, Min, Max, IsUUID } from 'class-validator';

export class DeliveryEstimateDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  restaurantLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  restaurantLongitude: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  customerLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  customerLongitude: number;
}