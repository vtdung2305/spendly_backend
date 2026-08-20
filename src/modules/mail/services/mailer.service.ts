import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from')!;
    this.resend = new Resend(this.config.get<string>('mail.resendApiKey'));
  }

  async send(input: SendMailInput): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) {
      throw new Error(`Failed to send email "${input.subject}" to ${input.to}: ${error.message}`);
    }
    this.logger.log(`Sent email "${input.subject}" to ${input.to}`);
  }
}
