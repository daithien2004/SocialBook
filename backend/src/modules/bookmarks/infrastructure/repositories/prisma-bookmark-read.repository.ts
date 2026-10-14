import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { BookmarkReadRepository } from '@/modules/bookmarks/application/ports/bookmark-read.repository';
import type { BookmarkReadModel } from '@/modules/bookmarks/application/read-models/bookmark.read-model';

@Injectable()
export class PrismaBookmarkReadRepository extends BookmarkReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findByBook(
    ability: AppAbility,
    bookId: string,
    { offset, limit }: PageParams,
  ): Promise<PageResult<BookmarkReadModel>> {
    const where = {
      AND: [accessibleBy(ability).ofType('Bookmark'), { bookId }],
    };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.bookmark.findMany({
        where,
        select: {
          id: true,
          userId: true,
          bookId: true,
          chapterId: true,
          chapterSlug: true,
          paragraphId: true,
          textPreview: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: limit,
      }),
      this.transactionHost.tx.bookmark.count({ where }),
    ]);

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        bookId: row.bookId,
        chapterId: row.chapterId,
        chapterSlug: row.chapterSlug,
        paragraphId: row.paragraphId,
        textPreview: row.textPreview,
      })),
    };
  }
}
