import { Command } from '@nestjs/cqrs';
import { OAuthProfile } from '@/modules/auth/application/auth/services/oauth-provider.strategy';
import type { Actor } from '@/shared/casl/actor';

export class OAuthAuthCommand extends Command<{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    image: string | undefined;
    role: string;
  };
}> {
  constructor(
    public readonly actor: Actor,
    public readonly profile: OAuthProfile,
  ) {
    super();
  }
}
