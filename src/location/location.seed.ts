import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';
import { City } from './entities/city.entity';

@Injectable()
export class LocationSeeder implements OnModuleInit {
  private readonly logger = new Logger(LocationSeeder.name);

  constructor(
    @InjectRepository(Country)
    private countryRepo: Repository<Country>,
    @InjectRepository(State)
    private stateRepo: Repository<State>,
    @InjectRepository(City)
    private cityRepo: Repository<City>,
  ) { }

  async onModuleInit() {
    // Wait for database and entities to be fully ready
    setTimeout(async () => {
      try {
        await this.seedLocations();
      } catch (error) {
        this.logger.error(`Error seeding locations: ${error.message}`);
        // Try again after a longer delay
        setTimeout(async () => {
          try {
            await this.seedLocations();
          } catch (retryError) {
            this.logger.error(`Error seeding locations on retry: ${retryError.message}`);
          }
        }, 15000);
      }
    }, 10000); // Increased delay to 10 seconds
  }

  private async seedLocations() {
    try {
      await this.seedCountries();
      await this.seedStates();
      await this.seedCities();
    } catch (error) {
      this.logger.error(`Error seeding locations: ${error.message}`);
    }
  }

  private async seedCountries() {
    const countries = [
      { name: 'Kenya', iso3: 'KEN', iso2: 'KE', phoneCode: '+254', currency: 'KES' },
    ];

    let count = 0;
    for (const countryData of countries) {
      const exists = await this.countryRepo.findOne({ where: { iso3: countryData.iso3 } });
      if (!exists) {
        await this.countryRepo.save(this.countryRepo.create(countryData));
        count++;
      }
    }
    if (count > 0) this.logger.log(`✅ Seeded ${count} countries`);
  }

  private async seedStates() {
    const kenya = await this.countryRepo.findOne({ where: { iso3: 'KEN' } });
    if (!kenya) return;

    const states = [
      { name: 'Nairobi', code: 'NAIROBI', countryId: kenya.id },
      { name: 'Kiambu', code: 'KIAMBU', countryId: kenya.id },
      { name: 'Machakos', code: 'MACHAKOS', countryId: kenya.id },
      { name: 'Kajiado', code: 'KAJIADO', countryId: kenya.id },
      { name: 'Nakuru', code: 'NAKURU', countryId: kenya.id },
      { name: 'Uasin Gishu', code: 'UASINGISHU', countryId: kenya.id },
      { name: 'Eldoret', code: 'ELDORET', countryId: kenya.id },
      { name: 'Mombasa', code: 'MOMBASA', countryId: kenya.id },
      { name: 'Kisumu', code: 'KISUMU', countryId: kenya.id },
      { name: 'Siaya', code: 'SIAYA', countryId: kenya.id },
    ];

    let count = 0;
    for (const stateData of states) {
      const exists = await this.stateRepo.findOne({ where: { name: stateData.name, countryId: stateData.countryId } });
      if (!exists) {
        await this.stateRepo.save(this.stateRepo.create(stateData));
        count++;
      }
    }
    if (count > 0) this.logger.log(`✅ Seeded ${count} states`);
  }

  private async seedCities() {
    const states = await this.stateRepo.find();
    const stateMap = new Map(states.map(state => [state.name, state.id]));

    const citiesData = [
      // Nairobi cities
      { name: 'Nairobi', stateName: 'Nairobi' },
      { name: 'Westlands', stateName: 'Nairobi' },
      { name: 'Karen', stateName: 'Nairobi' },
      { name: 'Kilimani', stateName: 'Nairobi' },
      { name: 'Parklands', stateName: 'Nairobi' },
      { name: 'River Road', stateName: 'Nairobi' },
      { name: 'CBD', stateName: 'Nairobi' },

      // Kiambu cities
      { name: 'Kiambu', stateName: 'Kiambu' },
      { name: 'Limuru', stateName: 'Kiambu' },
      { name: 'Thika', stateName: 'Kiambu' },

      // Machakos cities
      { name: 'Machakos', stateName: 'Machakos' },
      { name: 'Athi River', stateName: 'Machakos' },

      // Kajiado cities
      { name: 'Kajiado', stateName: 'Kajiado' },
      { name: 'Ngong', stateName: 'Kajiado' },

      // Nakuru cities
      { name: 'Nakuru', stateName: 'Nakuru' },
      { name: 'Naivasha', stateName: 'Nakuru' },

      // Uasin Gishu cities
      { name: 'Eldoret', stateName: 'Uasin Gishu' },
      { name: 'Iten', stateName: 'Uasin Gishu' },

      // Mombasa cities
      { name: 'Mombasa', stateName: 'Mombasa' },
      { name: 'Kilifi', stateName: 'Mombasa' },

      // Kisumu cities
      { name: 'Kisumu', stateName: 'Kisumu' },
      { name: 'Kondele', stateName: 'Kisumu' },
      { name: 'Mombasa Rd', stateName: 'Kisumu' },

      // Siaya cities
      { name: 'Siaya', stateName: 'Siaya' },
      { name: 'Alego', stateName: 'Siaya' },
    ];

    let count = 0;
    for (const cityData of citiesData) {
      const stateId = stateMap.get(cityData.stateName);
      if (stateId) {
        const exists = await this.cityRepo.findOne({ where: { name: cityData.name, stateId } });
        if (!exists) {
          await this.cityRepo.save(this.cityRepo.create({ name: cityData.name, stateId }));
          count++;
        }
      }
    }
    if (count > 0) this.logger.log(`✅ Seeded ${count} cities`);
  }
}
