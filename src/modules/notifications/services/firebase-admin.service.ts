import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushResult {
  invalidTokens: string[];
}

/**
 * Thin wrapper over the Firebase Admin SDK. If FIREBASE_* env vars aren't set,
 * push is a no-op (logged once) so local/dev/CI don't need a real Firebase
 * project — the in-app Notification row is still created either way.
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app?: admin.app.App;
  private warnedOnce = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('firebase.projectId');
    const clientEmail = this.config.get<string>('firebase.clientEmail');
    const privateKey = this.config.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('FIREBASE_* env vars not set — push notifications are disabled (in-app notifications still work).');
      return;
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  async sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<PushResult> {
    if (tokens.length === 0) return { invalidTokens: [] };

    if (!this.app) {
      if (!this.warnedOnce) {
        this.logger.warn('Push notification skipped — Firebase is not configured.');
        this.warnedOnce = true;
      }
      return { invalidTokens: [] };
    }

    const response = await admin.messaging(this.app).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success && this.isUnregisteredError(r.error?.code)) {
        invalidTokens.push(tokens[i]);
      }
    });

    return { invalidTokens };
  }

  private isUnregisteredError(code?: string): boolean {
    return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token';
  }
}
