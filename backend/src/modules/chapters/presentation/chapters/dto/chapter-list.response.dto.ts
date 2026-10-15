import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChapterListReadModel } from '@/modules/chapters/application/read-models/chapter-list.read-model';

class ChapterListBookResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  coverUrl!: string;

  @ApiProperty()
  authorId!: string;
}

class ChapterListItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  orderIndex!: number;

  @ApiProperty()
  viewsCount!: number;

  @ApiProperty()
  paragraphsCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ enum: ['completed'] })
  ttsStatus?: 'completed';

  @ApiPropertyOptional()
  audioUrl?: string | null;
}

export class ChapterListResponseDto {
  @ApiProperty({ type: ChapterListBookResponseDto })
  book!: ChapterListBookResponseDto;

  @ApiProperty({ type: ChapterListItemResponseDto, isArray: true })
  chapters!: ChapterListItemResponseDto[];

  @ApiProperty()
  total!: number;

  private constructor(readModel: ChapterListReadModel) {
    this.book = {
      id: readModel.book.id,
      title: readModel.book.title,
      slug: readModel.book.slug,
      coverUrl: readModel.book.coverUrl,
      authorId: readModel.book.authorId,
    };
    this.chapters = readModel.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      slug: chapter.slug,
      orderIndex: chapter.orderIndex,
      viewsCount: chapter.viewsCount,
      paragraphsCount: chapter.paragraphsCount,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      ttsStatus: chapter.ttsStatus,
      audioUrl: chapter.audioUrl,
    }));
    this.total = readModel.total;
  }

  static fromReadModel(
    readModel: ChapterListReadModel,
  ): ChapterListResponseDto {
    return new ChapterListResponseDto(readModel);
  }
}
