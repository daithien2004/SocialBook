import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReviewReadModel } from '../../application/read-models/review.read-model';

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  verifiedPurchase: boolean;

  @ApiProperty()
  isFlagged: boolean;

  @ApiPropertyOptional()
  moderationStatus?: string;

  @ApiPropertyOptional({ type: Object })
  user?: { id: string; username: string; image?: string };

  @ApiPropertyOptional({ type: Object })
  book?: { id: string; title: string; coverUrl?: string };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  isLiked?: boolean;

  constructor(review: ReviewReadModel) {
    this.id = review.id;
    this.content = review.content;
    this.rating = review.rating;
    this.likesCount = review.likesCount;
    this.verifiedPurchase = review.verifiedPurchase;
    this.isFlagged = review.isFlagged;
    this.moderationStatus = review.moderationStatus;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;

    this.user = {
      id: review.user.id,
      username: review.user.username,
      image: review.user.image ?? undefined,
    };
    this.book = {
      id: review.book.id,
      title: review.book.title,
      coverUrl: review.book.coverUrl ?? undefined,
    };
    this.isLiked = review.isLiked;
  }

  static fromReadModel(review: ReviewReadModel): ReviewResponseDto {
    return new ReviewResponseDto(review);
  }

  static fromReadModels(reviews: ReviewReadModel[]): ReviewResponseDto[] {
    return reviews.map((review) => new ReviewResponseDto(review));
  }
}
