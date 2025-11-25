import { IsBoolean } from 'class-validator';

export class MarkReadDto {
  @IsBoolean()
  isRead: boolean;
}