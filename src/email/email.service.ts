import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('Email credentials not configured. Email service will not work.');
      }
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log('Transporter not ready, attempting to initialize...');
      this.initializeTransporter();
    }

    if (!this.transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.error('Email transporter could not be initialized. Check keys in .env');
      }
      return false;
    }

    try {
      const mailOptions = {
        from: `"Trello Clone" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return false;
    }
  }

  private loadTemplate(name: string, variables: Record<string, string>): string {
    try {
      // Shrewd way to find the template path whether we run from src or dist
      const srcPath = path.join(process.cwd(), 'src/templates/emails', `${name}.html`);
      const distPath = path.join(process.cwd(), 'dist/templates/emails', `${name}.html`);
      
      const templatePath = fs.existsSync(srcPath) ? srcPath : distPath;
      
      let html = fs.readFileSync(templatePath, 'utf-8');

      for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      return html;
    } catch (error) {
      this.logger.error(`Failed to load email template: ${name}`, error);
      return '';
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const html = this.loadTemplate('welcome', { userName, userEmail });

    return this.sendEmail({
      to: userEmail,
      subject: '🎉 Welcome to Trello Clone! Registration successful',
      html,
    });
  }
}
