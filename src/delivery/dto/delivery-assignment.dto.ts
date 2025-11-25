import { IsUUID, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class DeliveryAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsUUID()
  @IsNotEmpty()
  driverId: string;

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