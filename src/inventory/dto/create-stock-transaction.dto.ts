import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  IsOptional, 
  IsEnum 
} from 'class-validator';
import { TransactionType } from '../entities/stock-transaction.entity';

export class CreateStockTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

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

  @IsUUID()
  @IsOptional()
  performedBy?: string;
}