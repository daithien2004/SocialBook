import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ReadingRoomReadRepository } from '@/modules/reading-rooms/infrastructure/mongo/repositories/reading-room-read.repository';
import { ReadingRoom } from '@/modules/reading-rooms/infrastructure/mongo/schemas/reading-room.schema';

class QueryFake {
  selectedFields: string | undefined;
  sortFields: Record<string, number> | undefined;
  skipCount: number | undefined;
  limitCount: number | undefined;
  leanCalled = false;

  constructor(private readonly result: unknown) {}

  select(fields: string): this {
    this.selectedFields = fields;
    return this;
  }

  sort(fields: Record<string, number>): this {
    this.sortFields = fields;
    return this;
  }

  skip(count: number): this {
    this.skipCount = count;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  lean(): this {
    this.leanCalled = true;
    return this;
  }

  exec(): Promise<unknown> {
    return Promise.resolve(this.result);
  }
}

class ReadingRoomModelFake {
  readonly activeQuery = new QueryFake([
    {
      _id: 'ROOM01',
      bookId: 'book-1',
      hostId: 'user-1',
      mode: 'sync',
      status: 'active',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
      members: [
        { userId: 'user-1', role: 'host' },
        { userId: 'user-2', role: 'member', leftAt: null },
        { userId: 'user-3', role: 'member', leftAt: new Date() },
      ],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ]);
  readonly historyQuery = new QueryFake([]);
  readonly countQuery = new QueryFake(3);
  activeFilter: unknown;
  historyFilter: unknown;

  constructor(private readonly useHistoryQuery = false) {}

  find(filter: unknown): QueryFake {
    if (this.useHistoryQuery) {
      this.historyFilter = filter;
      return this.historyQuery;
    }
    if (this.activeFilter === undefined) {
      this.activeFilter = filter;
      return this.activeQuery;
    }
    this.historyFilter = filter;
    return this.historyQuery;
  }

  countDocuments(filter: unknown): QueryFake {
    this.historyFilter = filter;
    return this.countQuery;
  }
}

describe('ReadingRoomReadRepository', () => {
  it('returns active member summaries from a lean projection', async () => {
    const model = new ReadingRoomModelFake();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReadingRoomReadRepository,
        { provide: getModelToken(ReadingRoom.name), useValue: model },
      ],
    }).compile();
    const repository = moduleRef.get(ReadingRoomReadRepository);

    const rooms = await repository.findActiveSummariesByUser('user-1');

    expect(rooms).toEqual([
      {
        roomId: 'ROOM01',
        bookId: 'book-1',
        hostId: 'user-1',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        membersCount: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        members: [
          { userId: 'user-1', role: 'host' },
          { userId: 'user-2', role: 'member' },
        ],
      },
    ]);
    expect(model.activeQuery.selectedFields).not.toContain('highlights');
    expect(model.activeQuery.leanCalled).toBe(true);
    await moduleRef.close();
  });

  it('preserves history pagination and total count', async () => {
    const model = new ReadingRoomModelFake(true);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReadingRoomReadRepository,
        { provide: getModelToken(ReadingRoom.name), useValue: model },
      ],
    }).compile();
    const repository = moduleRef.get(ReadingRoomReadRepository);

    const result = await repository.findHistorySummariesByUser('user-1', {
      skip: 20,
      limit: 10,
    });

    expect(result).toEqual({ items: [], total: 3 });
    expect(model.historyQuery.skipCount).toBe(20);
    expect(model.historyQuery.limitCount).toBe(10);
    expect(model.historyQuery.sortFields).toEqual({ endedAt: -1 });
    expect(model.historyQuery.selectedFields).not.toContain('highlights');
    await moduleRef.close();
  });
});
