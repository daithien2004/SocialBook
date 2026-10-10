import { Test, TestingModule } from '@nestjs/testing';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { randomUUID } from 'node:crypto';
import { Connection, Model, Types } from 'mongoose';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User as UserEntity } from '@/modules/users/domain/users/entities/user.entity';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import {
  UserRoleChangeOutboxDocument,
  UserRoleChangeOutboxRecord,
} from '@/modules/users/infrastructure/outbox/user-role-change-outbox.schema';
import { UserRoleChangeOutboxPort } from '@/modules/users/application/users/user-role-change-outbox.port';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/repositories/users/users-repository.module';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { assertMongoTransactionCapability } from '@/shared/infrastructure/mongo-transaction-capability';

describe('user role outbox transaction', () => {
  let replicaSet: MongoMemoryReplSet;
  let moduleRef: TestingModule;
  let connection: Connection;
  let users: IUserRepository;
  let outbox: UserRoleChangeOutboxPort;
  let unitOfWork: UnitOfWorkPort;

  beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(replicaSet.getUri(), {
          dbName: 'socialbook_user_outbox_test',
        }),
        UsersRepositoryModule,
      ],
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    users = moduleRef.get(IUserRepository);
    outbox = moduleRef.get(UserRoleChangeOutboxPort);
    unitOfWork = moduleRef.get(UnitOfWorkPort);
    await assertMongoTransactionCapability(connection);
    const outboxModel = moduleRef.get<Model<UserRoleChangeOutboxDocument>>(
      getModelToken(UserRoleChangeOutboxRecord.name),
    );
    await outboxModel.init();
  }, 60_000);

  afterAll(async () => {
    await moduleRef.close();
    await replicaSet.stop();
  });

  it('commits user and outbox together, and rolls both back on outbox failure', async () => {
    const userId = UserId.create(new Types.ObjectId().toString());
    const eventId = randomUUID();
    const user = UserEntity.create({
      id: userId,
      roleId: new Types.ObjectId().toString(),
      username: `outbox-user-${userId.toString()}`,
      email: `outbox-${userId.toString()}@example.test`,
    });
    user.ban();

    await unitOfWork.execute(async () => {
      await users.save(user);
      await outbox.append({
        id: eventId,
        userId: userId.toString(),
        roleId: user.roleId,
      });
    });

    await expect(
      unitOfWork.execute(async () => {
        const persistedUser = await users.findById(userId);
        if (!persistedUser) throw new Error('User missing inside transaction');
        persistedUser.unban();
        await users.save(persistedUser);
        await outbox.append({
          id: eventId,
          userId: userId.toString(),
          roleId: persistedUser.roleId,
        });
      }),
    ).rejects.toMatchObject({ code: 11000 });

    const persistedUser = await users.findById(userId);
    const persistedEvents = await outbox.claimBatch(25);
    expect(persistedUser?.isBanned).toBe(true);
    expect(persistedEvents).toHaveLength(1);
    expect(persistedEvents[0]?.id).toBe(eventId);
  }, 30_000);
});
