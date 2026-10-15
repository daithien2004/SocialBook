import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';

class ChapterDetailBookResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  authorId!: string;

  @ApiPropertyOptional()
  authorName?: string;

  @ApiProperty({ type: Object, isArray: true })
  genres!: ChapterDetailReadModel['book']['genres'];

  @ApiProperty()
  description!: string;

  @ApiProperty()
  publishedYear!: string;

  @ApiProperty()
  coverUrl!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: String, isArray: true })
  tags!: string[];

  @ApiProperty({ type: String, isArray: true })
  likedBy!: string[];

  @ApiProperty({ type: Object })
  stats!: ChapterDetailReadModel['book']['stats'];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class ChapterDetailParagraphResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;
}

class ChapterNavigationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  orderIndex!: number;
}

class ChapterDetailContentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  orderIndex!: number;

  @ApiProperty()
  viewsCount!: number;

  @ApiProperty({ type: ChapterDetailParagraphResponseDto, isArray: true })
  paragraphs!: ChapterDetailParagraphResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class ChapterNavigationGroupResponseDto {
  @ApiProperty({ type: ChapterNavigationResponseDto, nullable: true })
  previous!: ChapterNavigationResponseDto | null;

  @ApiProperty({ type: ChapterNavigationResponseDto, nullable: true })
  next!: ChapterNavigationResponseDto | null;
}

export class ChapterDetailResponseDto {
  @ApiProperty({ type: ChapterDetailBookResponseDto })
  book!: ChapterDetailBookResponseDto;

  @ApiProperty({ type: ChapterDetailContentResponseDto })
  chapter!: ChapterDetailContentResponseDto;

  @ApiProperty({ type: ChapterNavigationGroupResponseDto })
  navigation!: ChapterNavigationGroupResponseDto;

  private constructor(readModel: ChapterDetailReadModel) {
    this.book = {
      id: readModel.book.id,
      title: readModel.book.title,
      slug: readModel.book.slug,
      authorId: readModel.book.authorId,
      authorName: readModel.book.authorName,
      genres: readModel.book.genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
      })),
      description: readModel.book.description,
      publishedYear: readModel.book.publishedYear,
      coverUrl: readModel.book.coverUrl,
      status: readModel.book.status,
      tags: [...readModel.book.tags],
      likedBy: [...readModel.book.likedBy],
      stats: {
        views: readModel.book.stats.views,
        likes: readModel.book.stats.likes,
        chapterCount: readModel.book.stats.chapterCount,
      },
      createdAt: readModel.book.createdAt,
      updatedAt: readModel.book.updatedAt,
    };
    this.chapter = {
      id: readModel.chapter.id,
      bookId: readModel.chapter.bookId,
      title: readModel.chapter.title,
      slug: readModel.chapter.slug,
      orderIndex: readModel.chapter.orderIndex,
      viewsCount: readModel.chapter.viewsCount,
      paragraphs: readModel.chapter.paragraphs.map((paragraph) => ({
        id: paragraph.id,
        content: paragraph.content,
      })),
      createdAt: readModel.chapter.createdAt,
      updatedAt: readModel.chapter.updatedAt,
    };
    this.navigation = {
      previous: readModel.navigation.previous
        ? { ...readModel.navigation.previous }
        : null,
      next: readModel.navigation.next ? { ...readModel.navigation.next } : null,
    };
  }

  static fromReadModel(
    readModel: ChapterDetailReadModel,
  ): ChapterDetailResponseDto {
    return new ChapterDetailResponseDto(readModel);
  }
}
