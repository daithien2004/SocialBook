import { User } from '@/modules/users/domain/users/entities/user.entity';

export interface UserCreationInput {
  readonly username: string;
  readonly email: string;
  readonly password?: string;
  readonly roleId?: string;
  readonly image?: string;
  readonly provider?: string;
  readonly providerId?: string;
}

export abstract class UserCreationPort {
  abstract create(input: UserCreationInput): Promise<User>;
}
