import { Review } from '../../domain/entities/review.entity';
import { ReviewDocument } from '../schemas/review.schema';
import { Types } from 'mongoose';

export class ReviewMapper {
  static toDomain(reviewDoc: ReviewDocument): Review {
    const id = reviewDoc._id.toString();
    
    let userId: string;
    let user: { id: string; username: string; image: string } | undefined;

    if (reviewDoc.userId && typeof reviewDoc.userId === 'object' && 'username' in reviewDoc.userId) {
        const userObj = reviewDoc.userId as any;
        userId = userObj._id.toString();
        user = {
            id: userObj._id.toString(),
            username: userObj.username,
            image: userObj.image
        };
    } else {
        userId = reviewDoc.userId?.toString();
    }

    let bookId: string;
    let book: { id: string; title: string; coverUrl: string } | undefined;

    if (reviewDoc.bookId && typeof reviewDoc.bookId === 'object' && 'title' in reviewDoc.bookId) {
        const bookObj = reviewDoc.bookId as any;
        bookId = bookObj._id.toString();
        book = {
            id: bookObj._id.toString(),
            title: bookObj.title,
            coverUrl: bookObj.coverUrl
        };
    } else {
        bookId = reviewDoc.bookId?.toString();
    }

    return Review.reconstitute({
      id,
      userId,
      bookId,
      content: reviewDoc.content,
      rating: reviewDoc.rating,
      createdAt: reviewDoc.createdAt as Date,
      updatedAt: reviewDoc.updatedAt as Date,
      likesCount: reviewDoc.likesCount,
      likedBy: reviewDoc.likedBy?.map(id => id.toString()) || [],
      isFlagged: reviewDoc.isFlagged,
      moderationStatus: reviewDoc.moderationStatus || 'pending',
      user,
      book
    });
  }

  static toPersistence(review: Review): any {
    return {
      userId: new Types.ObjectId(review.userId),
      bookId: new Types.ObjectId(review.bookId),
      content: review.content,
      rating: review.rating,
      isFlagged: review.isFlagged,
      moderationStatus: review.moderationStatus,
    };
  }
}
