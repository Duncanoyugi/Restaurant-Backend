import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { State } from './state.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Address } from './address.entity';

@Entity('city')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid', name: 'state_id' })
  stateId: string;

  @ManyToOne(() => State, (state) => state.cities)
  @JoinColumn({ name: 'state_id' })
  state: State;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.city)
  restaurants: Restaurant[];

  @OneToMany(() => Address, (address) => address.city)
  addresses: Address[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}