import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from')!;
    const user = this.config.get<string>('mail.smtpUser');
    const pass = this.config.get<string>('mail.smtpPass');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.smtpHost'),
      port: this.config.get<number>('mail.smtpPort'),
      secure: this.config.get<boolean>('mail.smtpSecure'),
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to: input.to, subject: input.subject, html: input.html });
    this.logger.log(`Sent email "${input.subject}" to ${input.to}`);
  }
}
