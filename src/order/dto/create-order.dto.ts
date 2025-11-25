import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  IsOptional, 
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsUUID()
  @IsOptional()
  deliveryAddressId?: string;

  @IsEnum(OrderType)
  @IsNotEmpty()
  orderType: OrderType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsDateString()
  @IsOptional()
  scheduledTime?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  items: CreateOrderItemDto[];
}