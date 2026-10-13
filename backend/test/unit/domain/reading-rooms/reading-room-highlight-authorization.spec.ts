import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';

describe('ReadingRoom highlight authorization', () => {
  it('forbids removing a highlight created by another user', () => {
    const room = ReadingRoom.create({
      bookId: '00000000-0000-4000-8000-000000000011',
      currentChapterId: '00000000-0000-4000-8000-000000000015',
      hostId: '00000000-0000-4000-8000-000000000012',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
    });
    room.addHighlight({
      userId: '00000000-0000-4000-8000-000000000012',
      chapterSlug: 'chapter-1',
      paragraphId: 'paragraph-1',
      content: 'A saved passage',
    });
    const highlight = room.highlights[0];
    const highlightId = highlight.id;

    if (!highlightId) {
      throw new Error('Expected created highlight to have an id');
    }

    expect(() => {
      room.removeHighlight(highlightId, '00000000-0000-4000-8000-000000000013');
    }).toThrow(ForbiddenDomainException);
  });
});
