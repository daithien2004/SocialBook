import { ApiProperty } from '@nestjs/swagger';
import { ChapterIndexDto } from './chapter-index.dto';

export class BookWithChapterDataDto {
  @ApiProperty({
    example: {
      _id: '652fcf3e9a1a7c001c2e6a55',
      title: 'Harry Potter',
      slug: 'harry-potter',
      author: 'J.K. Rowling',
      createdAt: '2025-09-25T09:00:00.000Z',
      updatedAt: '2025-09-25T09:00:00.000Z',
    },
  })
  book: any;

  @ApiProperty({
    example: {
      _id: '652fd0a59a1a7c001c2e6a56',
      bookId: '652fcf3e9a1a7c001c2e6a55',
      title: 'Chapter 1 - The Boy Who Lived',
      slug: 'chapter-1',
      orderIndex: 1,
      content: '<p>Once upon a time...</p>',
      createdAt: '2025-09-25T09:05:00.000Z',
      updatedAt: '2025-09-25T09:05:00.000Z',
    },
  })
  firstChapter: any;

  @ApiProperty({ type: [ChapterIndexDto] })
  allIndex: ChapterIndexDto[];
}
