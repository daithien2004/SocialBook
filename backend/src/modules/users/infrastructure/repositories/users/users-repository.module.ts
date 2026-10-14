import { Module } from '@nestjs/common';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UsersRepository } from './users.repository';
import { UserRoleChangeOutboxRepository } from '../../outbox/user-role-change-outbox.repository';
import { UserRoleChangeOutboxPort } from '@/modules/users/application/users/user-role-change-outbox.port';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { PrismaUnitOfWork } from '@/core/database/postgres/prisma-unit-of-work';
import { CurrentUserReadRepository } from '../../../application/ports/current-user-read.repository';
import { PrismaCurrentUserReadRepository } from './prisma-current-user-read.repository';

@Module({
  providers: [
    PrismaUnitOfWork,
    { provide: UnitOfWorkPort, useExisting: PrismaUnitOfWork },
    {
      provide: IUserRepository,
      useClass: UsersRepository,
    },
    {
      provide: CurrentUserReadRepository,
      useClass: PrismaCurrentUserReadRepository,
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
    UserRoleChangeOutboxPort,
    UnitOfWorkPort,
  ],
})
export class UsersRepositoryModule {}
