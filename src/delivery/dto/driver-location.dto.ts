// backend\src\delivery\dto\driver-location.dto.ts
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class DriverLocationDto {
  @IsNumber()
  driverId: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;
}