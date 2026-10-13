import { TransactionHost } from '@nestjs-cls/transactional';
import { Test } from '@nestjs/testing';
import { ReadingRoomReadRepository } from '@/modules/reading-rooms/infrastructure/postgres/reading-room-read.repository';

describe('ReadingRoomReadRepository', () => {
  it('joins the current chapter slug when loading room details', async () => {
    const findUnique = jest.fn().mockResolvedValue({
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
      members: [{ userId: 'user-1', role: 'host', leftAt: null }],
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReadingRoomReadRepository,
        {
          provide: TransactionHost,
          useValue: { tx: { readingRoom: { findUnique } } },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(ReadingRoomReadRepository)
      .findDetailsById('ROOM01');

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ROOM01' } }),
    );
    expect(result).toMatchObject({
      roomId: 'ROOM01',
      currentChapterId: 'chapter-1',
      currentChapterSlug: 'latest-slug',
      members: [{ userId: 'user-1', role: 'host' }],
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
        ReadingRoomReadRepository,
        {
          provide: TransactionHost,
          useValue: { tx: { readingRoom: { findMany, count } } },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(ReadingRoomReadRepository)
      .findActiveSummariesByUser('user-1', { offset: 0, limit: 10 });

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
