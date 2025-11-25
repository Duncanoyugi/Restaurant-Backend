import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryTrackingDto } from './create-delivery-tracking.dto';

export class UpdateDeliveryDto extends PartialType(CreateDeliveryTrackingDto) {}