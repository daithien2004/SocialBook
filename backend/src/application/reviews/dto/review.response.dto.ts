import { ApiProperty } from '@nestjs/swagger';
import { Review } from '@/domain/reviews/entities/review.entity';

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

    @ApiProperty({ required: false })
    moderationStatus?: string;

    @ApiProperty({ type: Object, required: false })
    user?: { id: string; username: string; image?: string };

    @ApiProperty({ type: Object, required: false })
    book?: { id: string; title: string; coverUrl?: string };

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(review: Review) {
        this.id = review.id.toString();
        this.content = review.content;
        this.rating = review.rating;
        this.likesCount = review.likesCount || 0;
        this.verifiedPurchase = false; // Default - can be updated if entity has this field
        this.isFlagged = review.isFlagged || false;
        this.moderationStatus = review.moderationStatus;
        this.createdAt = review.createdAt;
        this.updatedAt = review.updatedAt;

        // Handle populated user
        if (review.user) {
            this.user = {
                id: review.user.id,
                username: review.user.username,
                image: review.user.image,
            };
        }

        // Handle populated book
        if (review.book) {
            this.book = {
                id: review.book.id,
                title: review.book.title,
                coverUrl: review.book.coverUrl,
            };
        }
    }

    static fromDomain(review: Review): ReviewResponseDto {
        return new ReviewResponseDto(review);
    }

    static fromArray(reviews: Review[]): ReviewResponseDto[] {
        return reviews.map(review => new ReviewResponseDto(review));
    }
}
