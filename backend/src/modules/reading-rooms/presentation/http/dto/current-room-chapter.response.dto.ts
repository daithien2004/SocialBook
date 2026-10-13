import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChapterDetailReadModel } from '@/modules/chapters';

type RoomChapterGenreSource = ChapterDetailReadModel['book']['genres'][number];
type RoomChapterBookStatsSource = ChapterDetailReadModel['book']['stats'];
type RoomChapterBookSource = ChapterDetailReadModel['book'];
type RoomChapterParagraphSource =
  ChapterDetailReadModel['chapter']['paragraphs'][number];
type RoomChapterDetailSource = ChapterDetailReadModel['chapter'];
type RoomChapterNavigationSource = NonNullable<
  ChapterDetailReadModel['navigation']['previous']
>;
type RoomChapterNavigationGroupSource = ChapterDetailReadModel['navigation'];

class RoomChapterGenreResponseDto implements RoomChapterGenreSource {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  constructor(source: ChapterDetailReadModel['book']['genres'][number]) {
    this.id = source.id;
    this.name = source.name;
    this.slug = source.slug;
  }
}

class RoomChapterBookStatsResponseDto implements RoomChapterBookStatsSource {
  @ApiProperty()
  views!: number;

  @ApiProperty()
  likes!: number;

  @ApiProperty()
  chapterCount!: number;

  constructor(source: ChapterDetailReadModel['book']['stats']) {
    this.views = source.views;
    this.likes = source.likes;
    this.chapterCount = source.chapterCount;
  }
}

class RoomChapterBookResponseDto implements RoomChapterBookSource {
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

  @ApiProperty({ type: RoomChapterGenreResponseDto, isArray: true })
  genres!: RoomChapterGenreResponseDto[];

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

  @ApiProperty({ type: RoomChapterBookStatsResponseDto })
  stats!: RoomChapterBookStatsResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional()
  chapterCount?: number;

  constructor(source: ChapterDetailReadModel['book']) {
    this.id = source.id;
    this.title = source.title;
    this.slug = source.slug;
    this.authorId = source.authorId;
    this.authorName = source.authorName;
    this.genres = source.genres.map(
      (genre) => new RoomChapterGenreResponseDto(genre),
    );
    this.description = source.description;
    this.publishedYear = source.publishedYear;
    this.coverUrl = source.coverUrl;
    this.status = source.status;
    this.tags = source.tags;
    this.likedBy = source.likedBy;
    this.stats = new RoomChapterBookStatsResponseDto(source.stats);
    this.createdAt = source.createdAt;
    this.updatedAt = source.updatedAt;
    this.chapterCount = source.chapterCount;
  }
}

class RoomChapterParagraphResponseDto implements RoomChapterParagraphSource {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  constructor(source: ChapterDetailReadModel['chapter']['paragraphs'][number]) {
    this.id = source.id;
    this.content = source.content;
  }
}

class RoomChapterDetailResponseDto implements RoomChapterDetailSource {
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

  @ApiProperty({ type: RoomChapterParagraphResponseDto, isArray: true })
  paragraphs!: RoomChapterParagraphResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  constructor(source: ChapterDetailReadModel['chapter']) {
    this.id = source.id;
    this.bookId = source.bookId;
    this.title = source.title;
    this.slug = source.slug;
    this.orderIndex = source.orderIndex;
    this.viewsCount = source.viewsCount;
    this.paragraphs = source.paragraphs.map(
      (paragraph) => new RoomChapterParagraphResponseDto(paragraph),
    );
    this.createdAt = source.createdAt;
    this.updatedAt = source.updatedAt;
  }
}

class RoomChapterNavigationResponseDto implements RoomChapterNavigationSource {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  orderIndex!: number;

  constructor(
    source: NonNullable<ChapterDetailReadModel['navigation']['previous']>,
  ) {
    this.id = source.id;
    this.title = source.title;
    this.slug = source.slug;
    this.orderIndex = source.orderIndex;
  }
}

class RoomChapterNavigationGroupResponseDto implements RoomChapterNavigationGroupSource {
  @ApiProperty({
    type: RoomChapterNavigationResponseDto,
    nullable: true,
  })
  previous!: RoomChapterNavigationResponseDto | null;

  @ApiProperty({
    type: RoomChapterNavigationResponseDto,
    nullable: true,
  })
  next!: RoomChapterNavigationResponseDto | null;

  constructor(source: ChapterDetailReadModel['navigation']) {
    this.previous = source.previous
      ? new RoomChapterNavigationResponseDto(source.previous)
      : null;
    this.next = source.next
      ? new RoomChapterNavigationResponseDto(source.next)
      : null;
  }
}

export class CurrentRoomChapterResponseDto implements ChapterDetailReadModel {
  @ApiProperty({ type: RoomChapterBookResponseDto })
  book!: RoomChapterBookResponseDto;

  @ApiProperty({ type: RoomChapterDetailResponseDto })
  chapter!: RoomChapterDetailResponseDto;

  @ApiProperty({ type: RoomChapterNavigationGroupResponseDto })
  navigation!: RoomChapterNavigationGroupResponseDto;

  constructor(source: ChapterDetailReadModel) {
    this.book = new RoomChapterBookResponseDto(source.book);
    this.chapter = new RoomChapterDetailResponseDto(source.chapter);
    this.navigation = new RoomChapterNavigationGroupResponseDto(
      source.navigation,
    );
  }

  static fromReadModel(
    source: ChapterDetailReadModel,
  ): CurrentRoomChapterResponseDto {
    return new CurrentRoomChapterResponseDto(source);
  }
}
