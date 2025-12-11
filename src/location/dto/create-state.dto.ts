import { IsString, IsNotEmpty, Length, IsInt } from 'class-validator';

export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code: string;

  @IsInt()
  @IsNotEmpty()
  countryId: number;  // Changed from string/UUID to number
}