import { ReviewDocument } from '../schemas/review.schema';

const toIdString = (id: any): string => {
    if (!id) return '';
    return typeof id === 'string' ? id : id.toString();
};

export class ReviewModal {
    id: string;
    content: string;
    rating: number;
    likesCount: number;
    verifiedPurchase: boolean;
    isFlagged: boolean;
    moderationStatus?: string;
    user?: { id: string; username: string; image?: string };
    book?: { id: string; title: string; slug: string };
    createdAt: Date;
    updatedAt: Date;

    constructor(review: ReviewDocument | any) {
        this.id = toIdString(review._id);
        this.content = review.content;
        this.rating = review.rating;
        this.likesCount = review.likesCount || 0;
        this.verifiedPurchase = review.verifiedPurchase || false;
        this.isFlagged = review.isFlagged || false;
        this.moderationStatus = review.moderationStatus;
        this.createdAt = review.createdAt;
        this.updatedAt = review.updatedAt;

        // Handle populated user
        if (review.userId && typeof review.userId === 'object' && review.userId.username) {
            this.user = {
                id: toIdString(review.userId._id),
                username: review.userId.username,
                image: review.userId.image,
            };
        }

        // Handle populated book
        if (review.bookId && typeof review.bookId === 'object' && review.bookId.title) {
            this.book = {
                id: toIdString(review.bookId._id),
                title: review.bookId.title,
                slug: review.bookId.slug,
            };
        }
    }

    static fromArray(reviews: (ReviewDocument | any)[]): ReviewModal[] {
        return reviews.map(review => new ReviewModal(review));
    }
}
