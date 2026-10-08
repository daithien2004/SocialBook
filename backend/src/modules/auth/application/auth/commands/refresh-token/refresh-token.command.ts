import { Command } from '@nestjs/cqrs';

import { FreshTokens } from '@/modules/auth/application/public-api';

export class RefreshTokenCommand extends Command<FreshTokens> {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {
    super();
  }
}
