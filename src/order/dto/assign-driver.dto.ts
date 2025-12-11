import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignDriverDto {
  @IsNumber()
  @IsNotEmpty()
  driverId: number;
}
