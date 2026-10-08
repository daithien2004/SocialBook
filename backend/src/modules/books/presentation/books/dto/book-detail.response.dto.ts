import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BookDetailReadModel,
  ChapterSummary,
} from '@/modules/books/domain/books/read-models/book-detail.read-model';

export class ChapterResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  private constructor(chapter: ChapterSummary) {
    this.id = chapter.id;
    this.title = chapter.title;
    this.slug = chapter.slug;
    this.content = chapter.content;
    this.orderIndex = chapter.orderIndex;
    this.viewsCount = chapter.viewsCount;
    this.createdAt = chapter.createdAt;
    this.updatedAt = chapter.updatedAt;
  }

  static fromReadModel(chapter: ChapterSummary): ChapterResponseDto {
    return new ChapterResponseDto(chapter);
  }
}

export class BookDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({
    type: 'object',
    required: ['id', 'name'],
    properties: { id: { type: 'string' }, name: { type: 'string' } },
  })
  authorId: { id: string; name: string };

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'name', 'slug'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
      },
    },
  })
  genres: { id: string; name: string; slug: string }[];

  @ApiProperty()
  description: string;

  @ApiProperty()
  publishedYear: string;

  @ApiProperty()
  coverUrl: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: [String] })
  likedBy: string[];

  @ApiProperty({
    type: 'object',
    required: [
      'views',
      'likes',
      'chapterCount',
      'averageRating',
      'totalRatings',
    ],
    properties: {
      views: { type: 'integer' },
      likes: { type: 'integer' },
      chapterCount: { type: 'integer' },
      averageRating: { type: 'number' },
      totalRatings: { type: 'integer' },
    },
  })
  stats: {
    views: number;
    likes: number;
    chapterCount: number;
    averageRating: number;
    totalRatings: number;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => ChapterResponseDto, isArray: true })
  chapters: ChapterResponseDto[];

  private constructor(readModel: BookDetailReadModel) {
    this.id = readModel.id;
    this.title = readModel.title;
    this.slug = readModel.slug;
    this.authorId = {
      id: readModel.authorId,
      name: readModel.authorName || '—',
    };
    this.genres = readModel.genres;
    this.description = readModel.description;
    this.publishedYear = readModel.publishedYear;
    this.coverUrl = readModel.coverUrl;
    this.status = readModel.status;
    this.tags = readModel.tags;
    this.likedBy = readModel.likedBy;
    this.stats = {
      views: readModel.stats.views,
      likes: readModel.stats.likes,
      chapterCount: readModel.stats.chapterCount,
      averageRating: readModel.stats.averageRating,
      totalRatings: readModel.stats.totalRatings,
    };
    this.createdAt = readModel.createdAt;
    this.updatedAt = readModel.updatedAt;
    this.chapters = readModel.chapters.map((ch) =>
      ChapterResponseDto.fromReadModel(ch),
    );
  }

  static fromReadModel(readModel: BookDetailReadModel): BookDetailResponseDto {
    return new BookDetailResponseDto(readModel);
  }
}
