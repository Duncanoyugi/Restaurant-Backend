import { IsUUID, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class DriverLocationDto {
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
}