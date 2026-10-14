import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ClsPluginTransactional,
  Transactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ClsModule } from 'nestjs-cls';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { PrismaReadingRoomRepository } from '@/modules/reading-rooms/infrastructure/persistence/prisma-reading-room.repository';
import { PrismaReadingRoomQueryRepository } from '@/modules/reading-rooms/infrastructure/persistence/prisma-reading-room-query.repository';
import { PrismaCreateRoomStore } from '@/modules/reading-rooms/infrastructure/persistence/prisma-create-room.store';
import { CreateRoomWriteCollision } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import { ReadingRoomConcurrencyError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { createReadingRoomAbility } from '@/modules/reading-rooms/application/policies/reading-room.ability';

const ids = {
  role: randomUUID(),
  host: randomUUID(),
  otherUser: randomUUID(),
  author: randomUUID(),
  book: randomUUID(),
  chapter: randomUUID(),
};
const suffix = randomUUID();
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://socialbook:socialbook_dev@localhost:5432/socialbook?schema=public';

@Injectable()
class ReadingRoomTransactionRunner {
  constructor(private readonly repository: PrismaReadingRoomRepository) {}

  @Transactional()
  save(room: ReadingRoom): Promise<void> {
    return this.repository.save(room);
  }
}

describe('PrismaReadingRoomRepository with PostgreSQL', () => {
  let moduleRef: TestingModule | undefined;
  let prisma: PrismaService | undefined;
  let transactionRunner: ReadingRoomTransactionRunner | undefined;
  let repository: PrismaReadingRoomRepository | undefined;
  let queryRepository: PrismaReadingRoomQueryRepository | undefined;
  let createRoomStore: PrismaCreateRoomStore | undefined;
  const roomIds: string[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ env: { DATABASE_URL: databaseUrl } })],
        }),
        ClsModule.forRoot({
          global: true,
          plugins: [
            new ClsPluginTransactional({
              imports: [PostgresDatabaseModule],
              adapter: new TransactionalAdapterPrisma({
                prismaInjectionToken: PrismaService,
                sqlFlavor: 'postgresql',
              }),
            }),
          ],
        }),
        PostgresDatabaseModule,
      ],
      providers: [
        PrismaReadingRoomRepository,
        PrismaReadingRoomQueryRepository,
        PrismaCreateRoomStore,
        ReadingRoomTransactionRunner,
      ],
    }).compile();

    await moduleRef.init();
    const testPrisma = moduleRef.get(PrismaService);
    prisma = testPrisma;
    transactionRunner = moduleRef.get(ReadingRoomTransactionRunner);
    repository = moduleRef.get(PrismaReadingRoomRepository);
    queryRepository = moduleRef.get(PrismaReadingRoomQueryRepository);
    createRoomStore = moduleRef.get(PrismaCreateRoomStore);

    await testPrisma.role.create({
      data: { id: ids.role, name: `rr-test-${suffix}` },
    });
    await testPrisma.user.create({
      data: {
        id: ids.host,
        roleId: ids.role,
        username: `rr-test-${suffix}`,
        email: `rr-test-${suffix}@example.test`,
      },
    });
    await testPrisma.user.create({
      data: {
        id: ids.otherUser,
        roleId: ids.role,
        username: `rr-other-${suffix}`,
        email: `rr-other-${suffix}@example.test`,
      },
    });
    await testPrisma.author.create({
      data: {
        id: ids.author,
        name: `rr-test-${suffix}`,
        slug: `rr-test-${suffix}`,
      },
    });
    await testPrisma.book.create({
      data: {
        id: ids.book,
        authorId: ids.author,
        title: 'Reading room repository test',
        slug: `rr-test-${suffix}`,
      },
    });
    await testPrisma.chapter.create({
      data: {
        id: ids.chapter,
        bookId: ids.book,
        title: 'Test chapter',
        slug: `rr-test-${suffix}`,
        orderIndex: 1,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) {
      await moduleRef?.close();
      return;
    }
    const db = prisma;
    await db.readingRoom.deleteMany({ where: { id: { in: roomIds } } });
    await db.chapter.deleteMany({ where: { id: ids.chapter } });
    await db.book.deleteMany({ where: { id: ids.book } });
    await db.author.deleteMany({ where: { id: ids.author } });
    await db.user.deleteMany({
      where: { id: { in: [ids.host, ids.otherUser] } },
    });
    await db.role.deleteMany({ where: { id: ids.role } });
    await moduleRef?.close();
  });

  it('persists and reloads an aggregate with its active member', async () => {
    const room = createRoom();
    roomIds.push(room.roomId);

    await getTransactionRunner().save(room);
    const loaded = await getRepository().findById(RoomId.create(room.roomId));

    expect(room.isNew).toBe(false);
    expect(loaded).not.toBeNull();
    expect(loaded?.activeMembers.map((member) => member.userId)).toEqual([
      ids.host,
    ]);
    expect(loaded?.loadedVersion).toBe(0);
  });

  it('persists an idempotency key and classifies duplicate request keys', async () => {
    const room = createRoom();
    roomIds.push(room.roomId);

    await getCreateRoomStore().createIdempotently(
      room,
      `request-${suffix}`,
      'fingerprint-v1',
    );
    const requestRecord = await getCreateRoomStore().findByRequestKey(
      ids.host,
      `request-${suffix}`,
    );

    expect(requestRecord?.roomId).toBe(room.roomId);
    expect(requestRecord?.fingerprint).toBe('fingerprint-v1');

    const collision = getCreateRoomStore().createIdempotently(
      createRoom(),
      `request-${suffix}`,
      'fingerprint-v1',
    );
    await expect(collision).rejects.toBeInstanceOf(CreateRoomWriteCollision);
    await expect(collision).rejects.toMatchObject({
      kind: 'idempotency-key',
    });

    await expect(
      getCreateRoomStore().createIdempotently(
        room,
        `different-request-${suffix}`,
        'fingerprint-v1',
      ),
    ).rejects.toMatchObject({ kind: 'room-code' });
  });

  it('rolls back the aggregate version when a related member write fails', async () => {
    const room = createRoom();
    roomIds.push(room.roomId);
    await getTransactionRunner().save(room);

    const loaded = await getRepository().findById(RoomId.create(room.roomId));
    if (!loaded) throw new Error('Test room was not persisted');
    loaded.addMember(randomUUID());

    await expect(getTransactionRunner().save(loaded)).rejects.toBeDefined();

    const persisted = await getPrisma().readingRoom.findUnique({
      where: { id: room.roomId },
      select: { version: true, members: { select: { userId: true } } },
    });
    expect(persisted?.version).toBe(0);
    expect(persisted?.members).toHaveLength(1);
  });

  it('rejects a stale aggregate version after another writer commits', async () => {
    const room = createRoom();
    roomIds.push(room.roomId);
    await getTransactionRunner().save(room);

    const [first, stale] = await Promise.all([
      getRepository().findById(RoomId.create(room.roomId)),
      getRepository().findById(RoomId.create(room.roomId)),
    ]);
    if (!first || !stale) throw new Error('Test room was not persisted');

    first.end();
    await getTransactionRunner().save(first);

    stale.addMember(randomUUID());
    await expect(getTransactionRunner().save(stale)).rejects.toBeInstanceOf(
      ReadingRoomConcurrencyError,
    );
  });

  it('applies CASL access conditions to the room detail query', async () => {
    const room = createRoom(ids.otherUser);
    room.end();
    roomIds.push(room.roomId);
    await getTransactionRunner().save(room);

    const details = await getQueryRepository().findDetailsById(
      room.roomId,
      createReadingRoomAbility({ userId: ids.host, roles: ['user'] }),
    );

    expect(details).toBeNull();
  });

  it('reads highlights only when the actor is an active room member', async () => {
    const room = createRoom();
    roomIds.push(room.roomId);
    await getTransactionRunner().save(room);

    const highlightId = randomUUID();
    await getPrisma().readingRoomHighlight.create({
      data: {
        id: highlightId,
        roomId: room.roomId,
        userId: ids.host,
        chapterSlug: `rr-test-${suffix}`,
        paragraphId: randomUUID(),
        content: 'A highlighted passage',
      },
    });

    const hostAbility = createReadingRoomAbility({
      userId: ids.host,
      roles: ['user'],
    });
    const otherUserAbility = createReadingRoomAbility({
      userId: ids.otherUser,
      roles: ['user'],
    });

    const highlight = await getQueryRepository().findHighlightById(
      room.roomId,
      highlightId,
      ids.host,
      hostAbility,
    );
    const page = await getQueryRepository().findHighlightPage(
      room.roomId,
      ids.host,
      { offset: 0, limit: 10 },
      hostAbility,
    );
    const denied = await getQueryRepository().findHighlightPage(
      room.roomId,
      ids.otherUser,
      { offset: 0, limit: 10 },
      otherUserAbility,
    );

    expect(highlight?.id).toBe(highlightId);
    expect(page).toMatchObject({ total: 1, items: [{ id: highlightId }] });
    expect(denied).toBeNull();
  });

  it('returns bounded active and history summaries for the requesting member', async () => {
    const hostAbility = createReadingRoomAbility({
      userId: ids.host,
      roles: ['user'],
    });
    const activeBefore = await getQueryRepository().findActiveSummariesByUser(
      ids.host,
      { offset: 0, limit: 100 },
      hostAbility,
    );
    const historyBefore = await getQueryRepository().findHistorySummariesByUser(
      ids.host,
      { offset: 0, limit: 100 },
      hostAbility,
    );
    const activeRoom = createRoom();
    const endedRoom = createRoom();
    endedRoom.end();
    roomIds.push(activeRoom.roomId, endedRoom.roomId);
    await getTransactionRunner().save(activeRoom);
    await getTransactionRunner().save(endedRoom);

    const activePage = await getQueryRepository().findActiveSummariesByUser(
      ids.host,
      { offset: 0, limit: 100 },
      hostAbility,
    );
    const historyPage = await getQueryRepository().findHistorySummariesByUser(
      ids.host,
      { offset: 0, limit: 100 },
      hostAbility,
    );

    expect(activePage.total).toBe(activeBefore.total + 1);
    expect(activePage.items).toContainEqual(
      expect.objectContaining({
        roomId: activeRoom.roomId,
        status: 'active',
        currentChapterSlug: `rr-test-${suffix}`,
        membersCount: 1,
      }),
    );
    expect(historyPage.total).toBe(historyBefore.total + 1);
    expect(historyPage.items).toContainEqual(
      expect.objectContaining({
        roomId: endedRoom.roomId,
        status: 'ended',
        membersCount: 1,
      }),
    );
  });

  function getPrisma(): PrismaService {
    if (!prisma) throw new Error('Prisma test module is not initialized');
    return prisma;
  }

  function getTransactionRunner(): ReadingRoomTransactionRunner {
    if (!transactionRunner) {
      throw new Error('Reading Room transaction runner is not initialized');
    }
    return transactionRunner;
  }

  function getRepository(): PrismaReadingRoomRepository {
    if (!repository) throw new Error('Repository is not initialized');
    return repository;
  }

  function getQueryRepository(): PrismaReadingRoomQueryRepository {
    if (!queryRepository)
      throw new Error('Query repository is not initialized');
    return queryRepository;
  }

  function getCreateRoomStore(): PrismaCreateRoomStore {
    if (!createRoomStore) {
      throw new Error('Create room store is not initialized');
    }
    return createRoomStore;
  }

  function createRoom(hostId: string = ids.host): ReadingRoom {
    return ReadingRoom.create({
      bookId: ids.book,
      currentChapterId: ids.chapter,
      hostId,
      mode: 'sync',
      currentChapterSlug: `rr-test-${suffix}`,
    });
  }
});
