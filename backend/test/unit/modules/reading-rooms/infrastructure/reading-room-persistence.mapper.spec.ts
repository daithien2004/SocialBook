import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { toReadingRoomCreateData } from '@/modules/reading-rooms/infrastructure/postgres/reading-room.mapper';

describe('ReadingRoom persistence mapper', () => {
  it('maps the stable chapter ID and slug snapshot to PostgreSQL fields', () => {
    const room = ReadingRoom.create({
      bookId: '00000000-0000-4000-8000-000000000011',
      currentChapterId: '00000000-0000-4000-8000-000000000015',
      hostId: '00000000-0000-4000-8000-000000000012',
      mode: 'free',
      currentChapterSlug: 'chapter-snapshot',
    });

    const persisted = toReadingRoomCreateData(room);

    expect(persisted.currentChapterId).toBe(
      '00000000-0000-4000-8000-000000000015',
    );
    expect(persisted.currentChapterSlug).toBe('chapter-snapshot');
  });
});
