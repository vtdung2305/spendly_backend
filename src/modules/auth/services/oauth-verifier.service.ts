import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface OAuthProfile {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

@Injectable()
export class OAuthVerifierService {
  private readonly googleClient: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.googleClient = new OAuth2Client(this.config.get<string>('oauth.googleClientId'));
  }

  async verifyGoogle(idToken: string): Promise<OAuthProfile> {
    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('oauth.googleClientId'),
      });
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return {
      providerId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? payload.name ?? 'Người dùng',
      lastName: payload.family_name ?? '',
      avatarUrl: payload.picture,
    };
  }

  async verifyFacebook(accessToken: string): Promise<OAuthProfile> {
    const appId = this.config.get<string>('oauth.facebookAppId');
    const appSecret = this.config.get<string>('oauth.facebookAppSecret');
    const appAccessToken = `${appId}|${appSecret}`;

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`,
    );
    const debugJson: any = await debugRes.json();
    if (!debugRes.ok || !debugJson?.data?.is_valid || debugJson.data.app_id !== appId) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${encodeURIComponent(accessToken)}`,
    );
    const profile: any = await profileRes.json();
    if (!profileRes.ok || !profile?.id || !profile?.email) {
      throw new UnauthorizedException('Unable to fetch Facebook profile (email permission required)');
    }

    return {
      providerId: profile.id,
      email: profile.email,
      firstName: profile.first_name ?? 'Người dùng',
      lastName: profile.last_name ?? '',
      avatarUrl: profile.picture?.data?.url,
    };
  }
}
