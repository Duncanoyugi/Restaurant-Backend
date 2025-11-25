import { 
  IsUUID, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  Min, 
  Max,
  IsString
} from 'class-validator';

export class CreateDeliveryTrackingDto {
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
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  longitude: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  speed?: number;

  @IsNumber()
  @Min(0)
  @Max(360)
  @IsOptional()
  heading?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  distanceToDestination?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  etaMinutes?: number;

  @IsString()
  @IsOptional()
  status?: string;
}