import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class SupplierSearchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}