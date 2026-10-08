import { describe, expect, it } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { GetRoomHighlightsHandler } from '@/modules/reading-rooms/application/queries/get-room-highlights/get-room-highlights.handler';
import { GetRoomHighlightsQuery } from '@/modules/reading-rooms/application/queries/get-room-highlights/get-room-highlights.query';
import { ReadingRoomHighlightPage } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { FakeReadingRoomRepository } from '../../../helpers/fake-reading-room.repository';

class HighlightPageRepository extends FakeReadingRoomRepository {
  requested: {
    roomId: string;
    userId: string;
    offset: number;
    limit: number;
  } | null = null;
  result: ReadingRoomHighlightPage | null = {
    total: 21,
    items: [
      {
        id: 'highlight-21',
        userId: 'reader-1',
        chapterSlug: 'chapter-1',
        paragraphId: 'paragraph-21',
        content: 'A paged highlight',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  };

  override findHighlightPage(
    roomId: import('@/modules/reading-rooms/domain/value-objects/room-id.vo').RoomId,
    userId: string,
    offset: number,
    limit: number,
  ) {
    this.requested = { roomId: roomId.toString(), userId, offset, limit };
    return Promise.resolve(this.result);
  }
}

describe('GetRoomHighlightsHandler', () => {
  it('delegates paging and membership identity to the repository', async () => {
    const repository = new HighlightPageRepository();
    const handler = new GetRoomHighlightsHandler(repository);

    const page = await handler.execute(
      new GetRoomHighlightsQuery('roomaa', 'reader-1', 20, 20),
    );

    expect(repository.requested).toEqual({
      roomId: 'ROOMAA',
      userId: 'reader-1',
      offset: 20,
      limit: 20,
    });
    expect(page).toEqual(repository.result);
  });

  it('returns not found when the room is missing or the caller is not a member', async () => {
    const repository = new HighlightPageRepository();
    repository.result = null;
    const handler = new GetRoomHighlightsHandler(repository);

    await expect(
      handler.execute(new GetRoomHighlightsQuery('roomaa', 'outsider', 0, 20)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
