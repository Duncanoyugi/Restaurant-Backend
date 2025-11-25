import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'pdf_url' })
  pdfUrl: string;

  @Column({ type: 'datetime', name: 'issued_at' })
  issuedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @ManyToOne(() => Payment, (payment) => payment.invoices)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}