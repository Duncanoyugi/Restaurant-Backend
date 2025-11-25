import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_log')
@Index(['recipientEmail', 'createdAt'])
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'recipient_email' })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'recipient_name' })
  recipientName: string;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 50 })
  template: string; // welcome, order_confirmation, reset_password, etc.

  @Column({ type: 'varchar', length: 50 })
  status: string; // sent, failed, queued

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'datetime', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
