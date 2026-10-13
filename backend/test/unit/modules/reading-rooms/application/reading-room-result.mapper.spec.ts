import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { toReadingRoomResult } from '@/modules/reading-rooms/application/mappers/reading-room-result.mapper';

describe('toReadingRoomResult', () => {
  it('maps room data and keeps its stored chapter slug snapshot', () => {
    const room = ReadingRoom.create({
      bookId: '00000000-0000-4000-8000-000000000011',
      currentChapterId: '00000000-0000-4000-8000-000000000015',
      hostId: '00000000-0000-4000-8000-000000000012',
      mode: 'free',
      currentChapterSlug: 'chapter-slug-at-room-write',
    });

    const result = toReadingRoomResult(room);

    expect(result.currentChapterId).toBe(room.currentChapterId);
    expect(result.currentChapterSlug).toBe('chapter-slug-at-room-write');
    expect(result.membersCount).toBe(1);
    expect(result.members).toEqual([{ userId: room.hostId, role: 'host' }]);
  });
});
