import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  IsOptional, 
  IsEnum,
  Min
} from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  capacity: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumCharge?: number;
}