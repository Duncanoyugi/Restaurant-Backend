import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_AUTH = 'two_factor_auth',
}

export enum OtpStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn()
  otp_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  otp_code: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  otp_type: OtpType;

  @Column({
    type: 'varchar',
    length: 20,
    default: OtpStatus.PENDING,
  })
  status: OtpStatus;

  @Column({ type: 'datetime2', nullable: false })
  expires_at: Date;

  @Column({ type: 'datetime2', nullable: true })
  verified_at: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updated_at: Date;
}