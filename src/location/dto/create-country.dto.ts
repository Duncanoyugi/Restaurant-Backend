import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  iso3: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  iso2: string;

  @IsString()
  @IsOptional()
  phoneCode?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}