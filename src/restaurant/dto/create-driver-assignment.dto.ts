import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverAssignmentDto {
  @ApiProperty()
  @IsUUID()
  restaurantId: string;

  @ApiProperty()
  @IsUUID()
  driverId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string = 'active';

  @ApiProperty({ required: false })
  @IsOptional()
  workingHours?: {
    start: string;
    end: string;
    days: string[];
  };
}