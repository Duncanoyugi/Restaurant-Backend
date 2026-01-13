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
      // Add connection pooling and keep-alive settings
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second between messages
      rateLimit: 5, // max 5 messages per rateDelta
      // Add timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Add TLS options for better compatibility
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      // Require TLS (STARTTLS) - helps with some providers
      requireTLS: !secure,
      // Add debug mode (can be removed in production)
      debug: this.configService.get<string>('NODE_ENV') !== 'production',
      logger: this.configService.get<string>('NODE_ENV') !== 'production',
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

  private async sendMailWithRetry(mailOptions: any, retries = 3, delay = 2000): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.transporter.sendMail(mailOptions);
        if (attempt > 1) {
          this.logger.log(`Email sent successfully on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        this.logger.warn(`Email send attempt ${attempt}/${retries} failed: ${error.message}`);
        
        if (attempt === retries) {
          throw error; // Throw on last attempt
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = delay * attempt;
        this.logger.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Re-verify connection before retrying
        try {
          await this.transporter.verify();
          this.logger.log('SMTP connection re-verified');
        } catch (verifyError) {
          this.logger.error('SMTP re-verification failed, reinitializing transporter...');
          this.initializeTransporter();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second after reinit
        }
      }
    }
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

      const result = await this.sendMailWithRetry(mailOptions);
      
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
      this.logger.error(`Failed to send email to ${to} after all retries:`, error);
      
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