import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OrderStatusDto {
  @IsNumber()
  @IsNotEmpty()
  statusId: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  updatedBy?: number;
}