import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { Review as ReviewEntity } from '@/modules/reviews/domain/entities/review.entity';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import {
  REVIEW_WITH_RELATIONS,
  toReviewCreateData,
  toReviewDomain,
} from './review.mapper';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async create(review: ReviewEntity): Promise<ReviewEntity> {
    const row = await this.transactionHost.tx.review.create({
      data: toReviewCreateData(review),
      include: REVIEW_WITH_RELATIONS,
    });
    return toReviewDomain(row);
  }

  async update(review: ReviewEntity): Promise<ReviewEntity> {
    const updated = await this.transactionHost.tx.review.updateMany({
      where: { id: review.id },
      data: {
        content: review.content,
        rating: review.rating,
        moderationStatus: review.moderationStatus,
        updatedAt: review.updatedAt,
      },
    });
    if (updated.count === 0) throw new NotFoundException('Review not found');

    const row = await this.transactionHost.tx.review.findUnique({
      where: { id: review.id },
      include: REVIEW_WITH_RELATIONS,
    });
    if (!row) throw new NotFoundException('Review not found');
    return toReviewDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.transactionHost.tx.review.deleteMany({ where: { id } });
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const row = await this.transactionHost.tx.review.findUnique({
      where: { id },
      include: REVIEW_WITH_RELATIONS,
    });
    return row ? toReviewDomain(row) : null;
  }

  async findByBookId(bookId: string): Promise<ReviewEntity[]> {
    const rows = await this.transactionHost.tx.review.findMany({
      where: { bookId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: REVIEW_WITH_RELATIONS,
    });
    return rows.map((row) => toReviewDomain(row));
  }

  async toggleLike(
    reviewId: string,
    userId: string,
  ): Promise<ReviewEntity | null> {
    const toggle = async (): Promise<ReviewEntity | null> => {
      const exists = await this.transactionHost.tx.review.findUnique({
        where: { id: reviewId },
        select: { id: true },
      });
      if (!exists) return null;

      const removed = await this.transactionHost.tx.reviewLike.deleteMany({
        where: { reviewId, userId },
      });
      if (removed.count > 0) {
        await this.transactionHost.tx.review.update({
          where: { id: reviewId },
          data: { likesCount: { decrement: 1 } },
        });
      } else {
        const created = await this.transactionHost.tx.reviewLike.createMany({
          data: [{ reviewId, userId }],
          skipDuplicates: true,
        });
        if (created.count > 0) {
          await this.transactionHost.tx.review.update({
            where: { id: reviewId },
            data: { likesCount: { increment: 1 } },
          });
        }
      }

      const row = await this.transactionHost.tx.review.findUnique({
        where: { id: reviewId },
        include: REVIEW_WITH_RELATIONS,
      });
      return row ? toReviewDomain(row) : null;
    };

    return this.transactionHost.isTransactionActive()
      ? toggle()
      : this.transactionHost.withTransaction(toggle);
  }

  async existsByUserAndBook(userId: string, bookId: string): Promise<boolean> {
    const count = await this.transactionHost.tx.review.count({
      where: { userId, bookId },
    });
    return count > 0;
  }

  async getStatsForBooks(
    bookIds: string[],
  ): Promise<Map<string, { rating: number; count: number }>> {
    if (bookIds.length === 0) return new Map();
    const rows = await this.transactionHost.tx.review.groupBy({
      by: ['bookId'],
      where: { bookId: { in: bookIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return new Map(
      rows.map((row) => [
        row.bookId,
        {
          rating: Math.round((row._avg.rating ?? 0) * 10) / 10,
          count: row._count._all,
        },
      ]),
    );
  }

  countTotal(): Promise<number> {
    return this.transactionHost.tx.review.count();
  }
}
