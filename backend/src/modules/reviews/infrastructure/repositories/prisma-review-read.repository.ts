import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { ReviewReadRepository } from '@/modules/reviews/application/ports/review-read.repository';
import type { ReviewReadModel } from '@/modules/reviews/application/read-models/review.read-model';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';

@Injectable()
export class PrismaReviewReadRepository implements ReviewReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findByBookId(
    bookId: string,
    ability: AppAbility,
    viewerId: string,
    { offset, limit }: PageParams,
  ): Promise<PageResult<ReviewReadModel>> {
    const where = {
      AND: [accessibleBy(ability).ofType('Review'), { bookId }],
    };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.review.findMany({
        where,
        select: {
          id: true,
          content: true,
          rating: true,
          likesCount: true,
          verifiedPurchase: true,
          isFlagged: true,
          moderationStatus: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, image: true } },
          book: { select: { id: true, title: true, coverUrl: true } },
          likes: {
            where: { userId: viewerId },
            select: { userId: true },
            take: 1,
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: Math.min(Math.max(limit, 1), 100),
      }),
      this.transactionHost.tx.review.count({ where }),
    ]);

    return {
      total,
      items: rows.map((row) => ({ ...row, isLiked: row.likes.length > 0 })),
    };
  }
}
