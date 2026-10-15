import { Injectable } from '@nestjs/common';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { UserEmail } from '@/modules/users/domain/users/value-objects/user-email.vo';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import {
  UserCreationInput,
  UserCreationPort,
} from '@/modules/users/application/user-creation.port';

@Injectable()
export class CreateUserService extends UserCreationPort {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly passwordHasher: IPasswordHasher,
  ) {
    super();
  }

  override async create(input: UserCreationInput): Promise<User> {
    const email = UserEmail.create(input.email);
    if (await this.userRepository.existsByEmail(email)) {
      throw new ConflictDomainException('Email already exists');
    }

    if (await this.userRepository.existsByUsername(input.username)) {
      throw new ConflictDomainException('Username already exists');
    }

    const password = input.password
      ? await this.passwordHasher.hash(input.password)
      : input.password;

    const user = User.create({
      id: UserId.create(this.idGenerator.generate()),
      roleId: input.roleId || 'default-role-id',
      username: input.username,
      email: input.email,
      password,
      image: input.image,
      provider: input.provider,
      providerId: input.providerId,
    });

    await this.userRepository.save(user);
    return user;
  }
}
