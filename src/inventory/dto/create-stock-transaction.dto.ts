import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsEnum,
  IsInt 
} from 'class-validator';
import { TransactionType } from '../entities/stock-transaction.entity';

export class CreateStockTransactionDto {
  @IsInt()
  @IsNotEmpty()
  inventoryItemId: number;  // Changed from string/UUID to number

  @IsNumber()
  @IsNotEmpty()
  quantityChange: number;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsInt()
  @IsOptional()
  performedBy?: number;    // Changed from string/UUID to number
}