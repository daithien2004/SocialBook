import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from '@/modules/users/infrastructure/schemas/user.schema';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UsersRepository } from './users.repository';
import { MongoPersistenceModule } from '@/shared/infrastructure/mongo-persistence.module';
import {
  UserRoleChangeOutboxRecord,
  UserRoleChangeOutboxSchema,
} from '../../outbox/user-role-change-outbox.schema';
import { UserRoleChangeOutboxRepository } from '../../outbox/user-role-change-outbox.repository';
import { UserRoleChangeOutboxPort } from '@/modules/users/application/users/user-role-change-outbox.port';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: UserRoleChangeOutboxRecord.name,
        schema: UserRoleChangeOutboxSchema,
      },
    ]),
    MongoPersistenceModule,
  ],
  providers: [
    {
      provide: IUserRepository,
      useClass: UsersRepository,
    },
    UserRoleChangeOutboxRepository,
    {
      provide: UserRoleChangeOutboxPort,
      useExisting: UserRoleChangeOutboxRepository,
    },
  ],
  exports: [IUserRepository, UserRoleChangeOutboxPort],
})
export class UsersRepositoryModule {}
