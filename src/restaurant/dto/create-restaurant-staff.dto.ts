import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsOptional, 
  IsNumber, 
  IsDateString,
  IsBoolean
} from 'class-validator';

export class CreateRestaurantStaffDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsString()
  @IsOptional()
  emergencyPhone?: string;
}