import { IsNumber, IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class StockAdjustmentDto {
  @IsInt()
  @IsNotEmpty()
  inventoryItemId: number;  // Changed from string/UUID to number

  @IsNumber()
  @IsNotEmpty()
  newQuantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsInt()
  @IsOptional()
  performedBy?: number;     // Changed from string/UUID to number
}