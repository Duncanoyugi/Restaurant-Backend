import { PartialType } from '@nestjs/mapped-types';
import { CreateRestaurantStaffDto } from './create-restaurant-staff.dto';

export class UpdateRestaurantStaffDto extends PartialType(CreateRestaurantStaffDto) {}