import { describe, expect, it } from '@jest/globals';
import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.interface';
import { toReadingRoomSnapshot } from '@/modules/reading-rooms/presentation/websocket/reading-room-snapshot.mapper';

describe('toReadingRoomSnapshot', () => {
  it('keeps highlight author fields at the top level without a nested user object', () => {
    const room: ReadingRoomResult = {
      roomId: 'ROOM_A',
      bookId: 'book-1',
      hostId: 'user-1',
      mode: 'sync',
      status: 'active',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
      membersCount: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      members: [{ userId: 'user-1', role: 'host' }],
      highlights: [
        {
          id: 'highlight-1',
          userId: 'user-1',
          displayName: 'Reader',
          avatarUrl: '/reader.png',
          chapterSlug: 'chapter-1',
          paragraphId: 'paragraph-1',
          content: 'A highlighted passage',
          createdAt: new Date('2026-01-01T00:01:00.000Z'),
        },
      ],
    };

    const snapshot = toReadingRoomSnapshot(room, []);
    expect(snapshot.members).toEqual([{ userId: 'user-1', role: 'host' }]);
    expect(snapshot.room).not.toHaveProperty('highlights');
    expect(snapshot.presences).toEqual([]);
  });
});
