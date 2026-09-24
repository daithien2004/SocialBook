import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import {
  GoogleIdTokenPayload,
  GoogleIdTokenPort,
} from '@/application/ports/google-id-token.port';
import { getErrorMessage } from '@/common/utils/error.util';

@Injectable()
export class GoogleIdTokenAdapter implements GoogleIdTokenPort {
  private readonly logger = new Logger(GoogleIdTokenAdapter.name);
  private readonly clientId: string;
  private readonly client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('env.GOOGLE_CLIENT_ID') ?? '';
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GoogleIdTokenPayload | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.email || !payload?.sub) return null;

      return {
        email: payload.email,
        sub: payload.sub,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to verify Google id_token: ${getErrorMessage(error)}`,
      );
      return null;
    }
  }
}
