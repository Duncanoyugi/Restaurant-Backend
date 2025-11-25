import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OrderStatusDto {
  @IsUUID()
  @IsNotEmpty()
  statusId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  updatedBy?: string;
}