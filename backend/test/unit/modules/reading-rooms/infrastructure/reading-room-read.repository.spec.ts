import { TransactionHost } from '@nestjs-cls/transactional';
import { Test } from '@nestjs/testing';
import { PrismaReadingRoomQueryRepository } from '@/modules/reading-rooms/infrastructure/persistence/prisma-reading-room-query.repository';
import { createReadingRoomActor } from '@/modules/reading-rooms/application/policies/reading-room.ability';

describe('PrismaReadingRoomQueryRepository', () => {
  it('loads a highlight only for an active room member', async () => {
    const roomFindFirst = jest.fn().mockResolvedValue({
      highlights: [
        {
          id: 'highlight-1',
          userId: 'user-1',
          displayName: 'Reader',
          avatarUrl: null,
          chapterSlug: 'chapter-one',
          paragraphId: 'paragraph-1',
          content: 'A saved passage',
          aiInsight: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaReadingRoomQueryRepository,
        {
          provide: TransactionHost,
          useValue: {
            tx: {
              readingRoom: { findFirst: roomFindFirst },
            },
          },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(PrismaReadingRoomQueryRepository)
      .findHighlightById(
        'ROOM01',
        'highlight-1',
        'user-1',
        createReadingRoomActor('user-1', 'user').ability,
      );

    expect(roomFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.any(Array) }),
        select: expect.objectContaining({
          highlights: expect.objectContaining({
            where: { id: 'highlight-1' },
            take: 1,
          }),
        }),
      }),
    );
    expect(roomFindFirst).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: 'highlight-1',
      userId: 'user-1',
      aiInsight: undefined,
    });
    await moduleRef.close();
  });

  it('loads highlight pages and their count through one authorized room query', async () => {
    const roomFindFirst = jest.fn().mockResolvedValue({
      highlights: [],
      _count: { highlights: 0 },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaReadingRoomQueryRepository,
        {
          provide: TransactionHost,
          useValue: { tx: { readingRoom: { findFirst: roomFindFirst } } },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(PrismaReadingRoomQueryRepository)
      .findHighlightPage(
        'ROOM01',
        'user-1',
        { offset: 20, limit: 10 },
        createReadingRoomActor('user-1', 'user').ability,
      );

    expect(roomFindFirst).toHaveBeenCalledTimes(1);
    expect(roomFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.any(Array) }),
        select: expect.objectContaining({
          highlights: expect.objectContaining({ skip: 20, take: 10 }),
          _count: { select: { highlights: true } },
        }),
      }),
    );
    expect(result).toEqual({ items: [], total: 0 });
    await moduleRef.close();
  });

  it('joins the current chapter slug when loading room details', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'ROOM01',
      bookId: 'book-1',
      hostId: 'user-1',
      mode: 'sync',
      status: 'active',
      currentChapterId: 'chapter-1',
      currentChapterSlug: 'old-slug',
      maxMembers: 10,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      chapter: { slug: 'latest-slug' },
      members: [{ userId: 'user-1', role: 'host' }],
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaReadingRoomQueryRepository,
        {
          provide: TransactionHost,
          useValue: { tx: { readingRoom: { findFirst } } },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(PrismaReadingRoomQueryRepository)
      .findDetailsById(
        'ROOM01',
        createReadingRoomActor('user-1', 'user').ability,
      );

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.any(Array) }),
        select: expect.objectContaining({
          members: expect.objectContaining({ where: { leftAt: null } }),
        }),
      }),
    );
    expect(result).toMatchObject({
      roomId: 'ROOM01',
      currentChapterId: 'chapter-1',
      currentChapterSlug: 'latest-slug',
      activeMembers: [{ userId: 'user-1', role: 'host' }],
    });
    await moduleRef.close();
  });

  it('returns active summaries with active members and a total count', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'ROOM01',
        bookId: 'book-1',
        hostId: 'user-1',
        mode: 'sync',
        status: 'active',
        currentChapterId: 'chapter-1',
        currentChapterSlug: 'old-slug',
        maxMembers: 10,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        chapter: { slug: 'latest-slug' },
        members: [
          { userId: 'user-1', role: 'host' },
          { userId: 'user-2', role: 'member' },
        ],
      },
    ]);
    const count = jest.fn().mockResolvedValue(1);
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaReadingRoomQueryRepository,
        {
          provide: TransactionHost,
          useValue: { tx: { readingRoom: { findMany, count } } },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(PrismaReadingRoomQueryRepository)
      .findActiveSummariesByUser(
        'user-1',
        { offset: 0, limit: 10 },
        createReadingRoomActor('user-1', 'user').ability,
      );

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      roomId: 'ROOM01',
      currentChapterSlug: 'latest-slug',
      membersCount: 2,
      members: [
        { userId: 'user-1', role: 'host' },
        { userId: 'user-2', role: 'member' },
      ],
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    await moduleRef.close();
  });
});
