import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleInfoDto } from './create-vehicle-info.dto';

export class UpdateVehicleInfoDto extends PartialType(CreateVehicleInfoDto) {}