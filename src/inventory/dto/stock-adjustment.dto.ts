import { IsUUID, IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class StockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @IsNotEmpty()
  newQuantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsOptional()
  performedBy?: string;
}