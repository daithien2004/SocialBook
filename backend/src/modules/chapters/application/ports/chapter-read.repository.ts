import { ChapterListReadModel } from '@/modules/chapters/application/read-models/chapter-list.read-model';
import {
  ChapterFilter,
  ChapterSortField,
} from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';
import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { ChapterAudioSourceReadModel } from '@/modules/chapters/application/read-models/chapter-audio-source.read-model';

export abstract class IChapterReadRepository {
  abstract findAudioSourceById(
    chapterId: string,
  ): Promise<ChapterAudioSourceReadModel | null>;

  abstract findAudioSourcesByBookId(
    bookId: string,
    limit: number,
  ): Promise<ChapterAudioSourceReadModel[]>;

  abstract findSlugsByIds(chapterIds: string[]): Promise<Map<string, string>>;

  abstract findDetailBySlug(
    ability: AppAbility,
    chapterSlug: string,
    bookSlug: string,
  ): Promise<ChapterDetailReadModel | null>;

  abstract findById(
    ability: AppAbility,
    chapterId: string,
  ): Promise<ChapterReadModel | null>;

  abstract isAccessibleBySlug(
    ability: AppAbility,
    chapterSlug: string,
    bookSlug: string,
  ): Promise<boolean>;

  abstract findCurrentRoomChapterById(
    bookId: string,
    chapterId: string,
  ): Promise<ChapterDetailReadModel | null>;

  abstract findDetailByBookIdAndSlug(
    bookId: string,
    chapterSlug: string,
  ): Promise<ChapterDetailReadModel | null>;

  abstract findPaginated(
    ability: AppAbility,
    filter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions<ChapterSortField>,
  ): Promise<PaginatedResult<ChapterReadModel>>;

  abstract findListByBookSlug(
    ability: AppAbility,
    bookSlug: string,
    pagination: PaginationOptions,
  ): Promise<ChapterListReadModel | null>;

  abstract countByBook(bookId: string): Promise<number>;

  abstract countChaptersForBooks(
    bookIds: string[],
  ): Promise<Map<string, number>>;
}
