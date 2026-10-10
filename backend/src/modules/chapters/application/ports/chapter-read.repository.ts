import { ChapterListReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-list.read-model';
import { ChapterFilter } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';
import { ChapterDetailReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-detail.read-model';
import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';

export abstract class IChapterReadRepository {
  abstract findDetailBySlug(
    chapterSlug: string,
    bookSlug: string,
  ): Promise<ChapterDetailReadModel | null>;

  abstract findPaginated(
    filter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterResult>>;

  abstract findListByBookSlug(
    bookSlug: string,
    pagination: PaginationOptions,
  ): Promise<ChapterListReadModel>;
}
