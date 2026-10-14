import { ApiProperty } from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import type { BookmarkReadModel } from '@/modules/bookmarks/application/read-models/bookmark.read-model';
import type { CreateBookmarkRequestDto } from './create-bookmark.request.dto';

export class BookmarkResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  chapterSlug!: string;

  @ApiProperty()
  paragraphId!: string;

  @ApiProperty()
  textPreview!: string;

  static fromReadModel(model: BookmarkReadModel): BookmarkResponseDto {
    const dto = new BookmarkResponseDto();
    dto.id = model.id;
    dto.userId = model.userId;
    dto.bookId = model.bookId;
    dto.chapterId = model.chapterId;
    dto.chapterSlug = model.chapterSlug;
    dto.paragraphId = model.paragraphId;
    dto.textPreview = model.textPreview;
    return dto;
  }

  static fromCreated(
    id: string,
    actor: Actor,
    request: CreateBookmarkRequestDto,
  ): BookmarkResponseDto {
    return BookmarkResponseDto.fromReadModel({
      id,
      userId: actor.userId,
      bookId: request.bookId,
      chapterId: request.chapterId,
      chapterSlug: request.chapterSlug,
      paragraphId: request.paragraphId,
      textPreview: request.textPreview,
    });
  }

  static fromArray(models: BookmarkReadModel[]): BookmarkResponseDto[] {
    return models.map((model) => BookmarkResponseDto.fromReadModel(model));
  }
}
