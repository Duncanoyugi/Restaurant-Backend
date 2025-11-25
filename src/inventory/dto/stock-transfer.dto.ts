import { IsUUID, IsNumber, IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';

export class StockTransferDto {
  @IsUUID()
  @IsNotEmpty()
  fromInventoryItemId: string;

  @IsUUID()
  @IsNotEmpty()
  toInventoryItemId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsUUID()
  @IsOptional()
  performedBy?: string;
}