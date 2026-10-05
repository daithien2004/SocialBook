import { Command } from '@nestjs/cqrs';

import { FreshTokens } from '@/application/ports/token-rotation.port';

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
