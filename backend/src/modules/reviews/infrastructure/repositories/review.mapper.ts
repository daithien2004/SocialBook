import { Prisma } from '@/core/database/generated/prisma/client';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

export const REVIEW_WITH_RELATIONS = {
  user: { select: { id: true, username: true, image: true } },
  book: { select: { id: true, title: true, coverUrl: true } },
  likes: { select: { userId: true } },
} satisfies Prisma.ReviewInclude;

export type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: typeof REVIEW_WITH_RELATIONS;
}>;

export function toReviewDomain(row: ReviewWithRelations): Review {
  return Review.reconstitute({
    id: row.id,
    userId: row.userId,
    bookId: row.bookId,
    content: row.content,
    rating: row.rating,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    likesCount: row.likesCount,
    likedBy: row.likes.map((like) => like.userId),
    isFlagged: row.isFlagged,
    moderationStatus: row.moderationStatus,
    user: {
      id: row.user.id,
      username: row.user.username,
      image: row.user.image ?? '',
    },
    book: {
      id: row.book.id,
      title: row.book.title,
      coverUrl: row.book.coverUrl,
    },
  });
}

export function toReviewCreateData(
  review: Review,
): Prisma.ReviewUncheckedCreateInput {
  return {
    id: review.id,
    userId: review.userId,
    bookId: review.bookId,
    content: review.content,
    rating: review.rating,
    likesCount: review.likesCount,
    isFlagged: review.isFlagged,
    moderationStatus: review.moderationStatus,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
