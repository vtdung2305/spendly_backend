import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './services/mailer.service';
import { MailProcessor } from './queue/mail.processor';
import { MailQueueService } from './queue/mail-queue.service';
import { MAIL_QUEUE } from './queue/mail-queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') },
      }),
    }),
    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
  providers: [MailerService, MailProcessor, MailQueueService],
  exports: [MailQueueService],
})
export class MailModule {}
