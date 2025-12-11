import { PartialType } from '@nestjs/swagger';
import { CreateVehicleInfoDto } from './create-vehicle-info.dto';

export class UpdateVehicleInfoDto extends PartialType(CreateVehicleInfoDto) {}