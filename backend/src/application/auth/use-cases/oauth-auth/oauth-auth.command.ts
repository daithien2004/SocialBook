import { OAuthProfile } from '@/application/auth/services/oauth-provider.strategy';

export class OAuthAuthCommand {
  constructor(public readonly profile: OAuthProfile) {}
}
