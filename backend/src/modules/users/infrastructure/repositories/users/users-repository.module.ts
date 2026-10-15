import { Module } from '@nestjs/common';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UsersRepository } from './users.repository';
import { UserRoleChangeOutboxRepository } from '../../outbox/user-role-change-outbox.repository';
import { UserRoleChangeOutboxPort } from '@/modules/users/application/users/user-role-change-outbox.port';
import { CurrentUserReadRepository } from '../../../application/ports/current-user-read.repository';
import { PrismaCurrentUserReadRepository } from './prisma-current-user-read.repository';
import { UsersReadRepository } from '../../../application/ports/users-read.repository';
import { PrismaUsersReadRepository } from './prisma-users-read.repository';

@Module({
  providers: [
    {
      provide: IUserRepository,
      useClass: UsersRepository,
    },
    {
      provide: CurrentUserReadRepository,
      useClass: PrismaCurrentUserReadRepository,
    },
    {
      provide: UsersReadRepository,
      useClass: PrismaUsersReadRepository,
    },
    UserRoleChangeOutboxRepository,
    {
      provide: UserRoleChangeOutboxPort,
      useExisting: UserRoleChangeOutboxRepository,
    },
  ],
  exports: [
    IUserRepository,
    CurrentUserReadRepository,
    UsersReadRepository,
    UserRoleChangeOutboxPort,
  ],
})
export class UsersRepositoryModule {}
