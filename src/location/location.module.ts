import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { LocationHelperService } from './location-helper.service';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';
import { City } from './entities/city.entity';
import { Address } from './entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Country,
      State, 
      City,
      Address
    ])
  ],
  controllers: [LocationController],
  providers: [LocationService, LocationHelperService],
  exports: [LocationService, LocationHelperService, TypeOrmModule],
})
export class LocationModule {}