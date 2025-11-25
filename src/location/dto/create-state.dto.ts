import { IsString, IsNotEmpty, IsUUID, Length } from 'class-validator';

export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code: string;

  @IsUUID()
  @IsNotEmpty()
  countryId: string;
}