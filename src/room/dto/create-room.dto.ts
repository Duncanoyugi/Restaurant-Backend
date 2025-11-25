import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsUUID, 
  IsOptional, 
  IsBoolean,
  IsArray,
  Min,
  Max
} from 'class-validator';

export class CreateRoomDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  capacity: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pricePerNight: number;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsOptional()
  imageGallery?: string[];

  @IsBoolean()
  @IsOptional()
  available?: boolean;
}