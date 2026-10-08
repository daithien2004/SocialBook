import { Query } from '@nestjs/cqrs';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { ChapterListReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-list.read-model';
import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';

export class GetChaptersQuery extends Query<
  PaginatedResult<ChapterResult> | ChapterListReadModel
> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly title?: string,
    public readonly bookId?: string,
    public readonly bookSlug?: string,
    public readonly orderIndex?: number,
    public readonly sortBy?:
      'createdAt' | 'updatedAt' | 'title' | 'orderIndex' | 'viewsCount',
    public readonly order?: 'asc' | 'desc',
  ) {
    super();
  }
}
