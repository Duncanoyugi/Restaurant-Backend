import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsOptional, 
  Length 
} from 'class-validator';

export class CreateVehicleInfoDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  vehicleMake: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsString()
  @Length(4, 4)
  @IsNotEmpty()
  vehicleYear: string;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;
}