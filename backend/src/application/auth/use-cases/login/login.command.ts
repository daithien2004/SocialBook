import type { User } from '@/domain/users/entities/user.entity';

export class LoginCommand {
  constructor(
    public readonly user: User,
    public readonly ip?: string,
    public readonly userAgent?: string,
  ) {}
}
