import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Country } from './country.entity';
import { City } from './city.entity';

@Entity('state')
export class State {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'uuid', name: 'country_id' })
  countryId: string;

  @ManyToOne(() => Country, (country) => country.states)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToMany(() => City, (city) => city.state)
  cities: City[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}