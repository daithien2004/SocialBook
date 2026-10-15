import type { Review } from '@/modules/reviews/domain/entities/review.entity';
import type { ReviewReadModel } from '../read-models/review.read-model';

export class ReviewResultMapper {
  static fromDomain(review: Review, isLiked = false): ReviewReadModel {
    return {
      id: review.id,
      content: review.content,
      rating: review.rating,
      likesCount: review.likesCount,
      verifiedPurchase: false,
      isFlagged: review.isFlagged,
      moderationStatus: review.moderationStatus,
      user: {
        id: review.user?.id ?? review.userId,
        username: review.user?.username ?? '',
        image: review.user?.image ?? null,
      },
      book: {
        id: review.book?.id ?? review.bookId,
        title: review.book?.title ?? '',
        coverUrl: review.book?.coverUrl ?? null,
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      isLiked,
    };
  }
}
