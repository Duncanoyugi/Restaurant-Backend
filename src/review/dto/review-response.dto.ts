import { IsString } from 'class-validator';

export class ReviewResponseDto {
  @IsString()
  adminResponse: string;
}