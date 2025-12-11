// backend\src\delivery\dto\create-vehicle-info.dto.ts
import { IsString, IsNumber, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleInfoDto {
  @ApiProperty({ description: 'User ID of the vehicle owner' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Vehicle manufacturer', example: 'Toyota' })
  @IsString()
  @Length(1, 50)
  vehicleMake: string;

  @ApiProperty({ description: 'Vehicle model', example: 'Camry' })
  @IsString()
  @Length(1, 50)
  vehicleModel: string;

  @ApiProperty({ description: 'Vehicle year', example: '2022' })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'Year must be a 4-digit number' })
  vehicleYear: string;

  @ApiProperty({ description: 'License plate number', example: 'ABC-123' })
  @IsString()
  @Length(1, 20)
  licensePlate: string;

  @ApiProperty({ description: 'Driver license number', example: 'DL1234567', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  licenseNumber?: string;

  @ApiProperty({ description: 'Vehicle color', example: 'Red', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  color?: string;

  @ApiProperty({ description: 'Vehicle type', example: 'Car', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  vehicleType?: string;
}