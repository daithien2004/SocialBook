import { Command } from '@nestjs/cqrs';
import type { User } from '@/domain/users/entities/user.entity';

export class LoginCommand extends Command<{
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
    public readonly user: User,
    public readonly ip?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
