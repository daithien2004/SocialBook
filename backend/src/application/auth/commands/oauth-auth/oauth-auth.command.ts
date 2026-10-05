import { Command } from '@nestjs/cqrs';
import { OAuthProfile } from '@/application/auth/services/oauth-provider.strategy';

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
  constructor(public readonly profile: OAuthProfile) {
    super();
  }
}
