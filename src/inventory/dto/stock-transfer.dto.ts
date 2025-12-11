import { IsNumber, IsNotEmpty, IsString, IsOptional, Min, IsInt } from 'class-validator';

export class StockTransferDto {
  @IsInt()
  @IsNotEmpty()
  fromInventoryItemId: number;  // Changed from string/UUID to number

  @IsInt()
  @IsNotEmpty()
  toInventoryItemId: number;    // Changed from string/UUID to number

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsInt()
  @IsOptional()
  performedBy?: number;         // Changed from string/UUID to number
}