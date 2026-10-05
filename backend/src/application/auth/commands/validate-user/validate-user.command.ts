import { Command } from '@nestjs/cqrs';
import { UserBannedDomainException } from "@/domain/auth/exceptions/auth-exceptions";
import { IPasswordHasher } from "@/shared/domain/password-hasher.interface";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { User } from "@/domain/users/entities/user.entity";

export class ValidateUserCommand extends Command<User | null> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
