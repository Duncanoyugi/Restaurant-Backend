import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsOptional, 
  IsDateString 
} from 'class-validator';

export class CreateShiftDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsDateString()
  @IsNotEmpty()
  shiftDate: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}