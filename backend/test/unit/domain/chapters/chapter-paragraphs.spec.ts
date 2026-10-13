import { Chapter } from '@/modules/chapters/domain/chapters/entities/chapter.entity';
import { ChapterId } from '@/modules/chapters/domain/chapters/value-objects/chapter-id.vo';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

describe('Chapter paragraph replacement', () => {
  const existingParagraphId = '64b7f1a93c0d2e5f6a7b8c9d';

  function createChapter(): Chapter {
    return Chapter.create({
      id: ChapterId.create('chapter-1'),
      title: 'Chapter One',
      bookId: 'book-1',
      paragraphs: [{ id: existingParagraphId, content: 'Original paragraph' }],
      orderIndex: 1,
    });
  }

  it('preserves existing paragraph IDs and creates UUIDs for new paragraphs', () => {
    const chapter = createChapter();

    chapter.replaceParagraphs([
      { id: existingParagraphId, content: 'Edited paragraph' },
      { content: 'New paragraph' },
    ]);

    expect(chapter.paragraphs[0]).toMatchObject({
      id: existingParagraphId,
      content: 'Edited paragraph',
    });
    expect(chapter.paragraphs[1].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects replacing the chapter paragraphs with an empty list', () => {
    const chapter = createChapter();

    expect(() => {
      chapter.replaceParagraphs([]);
    }).toThrow(BadRequestDomainException);
  });

  it('tracks persistence version and dirty state for optimistic locking', () => {
    const chapter = createChapter();

    expect(chapter.isNew).toBe(true);
    expect(chapter.isDirty).toBe(true);
    expect(chapter.loadedVersion).toBe(0);

    chapter.markPersisted(0);
    expect(chapter.isNew).toBe(false);
    expect(chapter.isDirty).toBe(false);

    chapter.changeTitle('A changed title');
    expect(chapter.isDirty).toBe(true);

    chapter.markPersisted(1);
    expect(chapter.loadedVersion).toBe(1);
    expect(chapter.isDirty).toBe(false);
  });
});
