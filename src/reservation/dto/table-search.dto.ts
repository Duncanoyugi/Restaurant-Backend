import { IsOptional, IsUUID, IsNumber, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '../entities/table.entity';

export class TableSearchDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minCapacity?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}