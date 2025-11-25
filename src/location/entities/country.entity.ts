import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { State } from './state.entity';

@Entity('country')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 3, unique: true })
  iso3: string;

  @Column({ type: 'varchar', length: 2, unique: true })
  iso2: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'phone_code' })
  phoneCode: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @OneToMany(() => State, (state) => state.country)
  states: State[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}