import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsUUID, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import type { ChapterSortField } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { GetChaptersQuery } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.query';

export class FilterChapterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Book ID không hợp lệ' })
  bookId?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'orderIndex', 'viewsCount'])
  declare sortBy?: ChapterSortField;

  toQuery(actor: Actor): GetChaptersQuery {
    return new GetChaptersQuery({
      actor,
      filter: {
        title: this.title,
        bookId: this.bookId,
        orderIndex: this.orderIndex,
      },
      pagination: { page: this.actualPage, limit: this.actualLimit },
      sort: { sortBy: this.sortBy, order: this.order },
    });
  }
}
