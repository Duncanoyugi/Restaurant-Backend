import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffAssignmentDto {
  @ApiProperty()
  @IsUUID()
  restaurantId: string;

  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiProperty()
  @IsString()
  role: string; // manager, chef, waiter, cashier, etc.

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string = 'active';
}