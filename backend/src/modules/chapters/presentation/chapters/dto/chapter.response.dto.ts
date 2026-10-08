import { ApiProperty } from '@nestjs/swagger';
import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';

class ChapterParagraphResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;
}

export class ChapterResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty({ type: ChapterParagraphResponseDto, isArray: true })
  paragraphs: ChapterParagraphResponseDto[];

  @ApiProperty()
  paragraphsCount: number;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  characterCount: number;

  @ApiProperty()
  contentPreview: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(chapter: ChapterResult) {
    this.id = chapter.id;
    this.title = chapter.title;
    this.slug = chapter.slug;
    this.bookId = chapter.bookId;
    this.paragraphs = chapter.paragraphs.map((p) => ({
      id: p.id,
      content: p.content,
    }));
    this.paragraphsCount = chapter.paragraphs.length;
    this.viewsCount = chapter.viewsCount;
    this.orderIndex = chapter.orderIndex;
    this.characterCount = chapter.characterCount;
    this.contentPreview = chapter.contentPreview;
    this.createdAt = chapter.createdAt;
    this.updatedAt = chapter.updatedAt;
  }

  static fromResult(chapter: ChapterResult): ChapterResponseDto {
    return new ChapterResponseDto(chapter);
  }

  static fromArray(chapters: ChapterResult[]): ChapterResponseDto[] {
    return chapters.map((chapter) => new ChapterResponseDto(chapter));
  }
}
