// backend\src\payment\entities\invoice.entity.ts
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
  @PrimaryGeneratedColumn() // Changed to autoincremental integer ID
  id: number; // Changed from string to number

  @Column({ type: 'int', name: 'payment_id' })
  paymentId: number;

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