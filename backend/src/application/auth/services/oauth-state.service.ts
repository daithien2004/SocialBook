import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { OAuthStateStorePort } from '@/application/ports/oauth-state-store.port';
import { OAuthFlowState } from '@/domain/auth/tokens/oauth-state.vo';

@Injectable()
export class OAuthStateService {
  constructor(private readonly store: OAuthStateStorePort) {}

  private randomToken(bytes: number): string {
    return randomBytes(bytes).toString('hex');
  }

  private sha256Base64Url(value: string): string {
    return createHash('sha256').update(value).digest('base64url');
  }

  async beginFlow(provider: 'google' | 'github', callbackUrl: string) {
    const state = this.randomToken(32);
    const codeVerifier = this.randomToken(48);
    await this.store.create(
      state,
      new OAuthFlowState(provider, codeVerifier, callbackUrl),
    );
    return {
      state,
      codeVerifier,
      codeChallenge: this.sha256Base64Url(codeVerifier),
      callbackUrl,
    };
  }

  getConsumedFlow(state: string): Promise<OAuthFlowState | null> {
    return this.store.consume(state);
  }
}
