import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

import { EmailLog } from './email-log.entity';
import { 
  SendMailOptions, 
  VerificationEmailData, 
  PasswordResetEmailData,
  WelcomeEmailData,
  OrderConfirmationData,
  OrderShippedData,
  OrderDeliveredData,
  OrderCancelledData,
  AccountUpdateData,
  NewsletterData
} from './interfaces/mail.interface';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    this.transporter.verify()
      .then(() => this.logger.log('SMTP transporter is ready'))
      .catch(error => this.logger.error('SMTP configuration error:', error));
  }

  private getTemplatePath(templateName: string): string {
    return path.join(__dirname, 'templates', `${templateName}.ejs`);
  }

  private async renderTemplate(templatePath: string, data: any): Promise<string> {
    try {
      return await ejs.renderFile(templatePath, data);
    } catch (error) {
      this.logger.error(`Failed to render template ${templatePath}:`, error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  private async logEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    body: string,
    template: string,
    status: string,
    errorMessage?: string,
    metadata?: Record<string, any>,
  ): Promise<EmailLog> {
    // FIX: Use object assignment instead of direct property assignment
    const emailLogData: Partial<EmailLog> = {
      recipientEmail,
      recipientName: recipientName || undefined,
      subject,
      body,
      template,
      status,
      errorMessage: errorMessage || undefined,
      metadata: metadata || undefined,
      sentAt: status === 'sent' ? new Date() : undefined,
    };

    // Remove undefined values
    Object.keys(emailLogData).forEach(key => {
      if (emailLogData[key as keyof EmailLog] === undefined) {
        delete emailLogData[key as keyof EmailLog];
      }
    });

    const emailLog = this.emailLogRepository.create(emailLogData as EmailLog);
    return this.emailLogRepository.save(emailLog);
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, template, context, from } = options;
    
    const fromEmail = from || this.configService.get<string>('DEFAULT_FROM_EMAIL', 'noreply@example.com');
    const fromName = this.configService.get<string>('DEFAULT_FROM_NAME', 'E-commerce Store');

    try {
      const templatePath = this.getTemplatePath(template);
      const html = await this.renderTemplate(templatePath, context);

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await this.logEmail(
        to,
        context.name || to.split('@')[0],
        subject,
        html,
        template,
        'sent',
        undefined, // No error message for successful sends
        { messageId: result.messageId }
      );

      this.logger.log(`Email sent successfully to ${to}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      
      await this.logEmail(
        to,
        context.name || to.split('@')[0],
        subject,
        '',
        template,
        'failed',
        error.message,
        { error: error.toString() }
      );

      return false;
    }
  }

  // Specific email methods for different use cases
  async sendVerificationEmail(email: string, name: string, otpCode: string): Promise<boolean> {
    const data: VerificationEmailData = {
      name,
      otpCode,
    };

    return this.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'verification-email',
      context: data,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, otpCode: string): Promise<boolean> {
    const data: PasswordResetEmailData = {
      name,
      otpCode,
    };

    return this.sendMail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: data,
    });
  }

  async sendWelcomeEmail(email: string, name: string, storeUrl: string): Promise<boolean> {
    const data: WelcomeEmailData = {
      name,
      storeUrl,
    };

    return this.sendMail({
      to: email,
      subject: 'Welcome to Our Store!',
      template: 'welcome-email',
      context: data,
    });
  }

  async sendOrderConfirmation(email: string, data: OrderConfirmationData): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: `Order Confirmation - ${data.orderNumber}`,
      template: 'order-confirmation',
      context: data,
    });
  }

  async sendAccountUpdateEmail(email: string, data: AccountUpdateData): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Account Update Notification',
      template: 'account-update',
      context: data,
    });
  }
}