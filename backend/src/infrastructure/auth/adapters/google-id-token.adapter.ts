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
  private readonly client: OAuth2Client | null;

  constructor(private readonly config: ConfigService) {
    const clientId = this.config.get<string>('env.GOOGLE_CLIENT_ID') ?? '';
    this.client = clientId ? new OAuth2Client(clientId) : null;
    if (!this.client) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID chưa được cấu hình — Google login sẽ bị từ chối (fail-closed).',
      );
    }
  }

  async verify(idToken: string): Promise<GoogleIdTokenPayload | null> {
    if (!this.client) return null;

    try {
      const clientId = this.config.get<string>('env.GOOGLE_CLIENT_ID') ?? '';
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: clientId,
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
