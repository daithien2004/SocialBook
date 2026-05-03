import { Review } from '@/domain/reviews/entities/review.entity';
import { ReviewDocument } from '../../schemas/review.schema';
import { Types } from 'mongoose';

interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  image: string;
}

interface PopulatedBook {
  _id: Types.ObjectId;
  title: string;
  coverUrl: string;
}

function isPopulatedUser(field: unknown): field is PopulatedUser {
  return typeof field === 'object' && field !== null && '_id' in field && 'username' in field;
}

function isPopulatedBook(field: unknown): field is PopulatedBook {
  return typeof field === 'object' && field !== null && '_id' in field && 'title' in field;
}

interface ReviewPersistence {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  content: string;
  rating: number;
  isFlagged: boolean;
  moderationStatus: string;
}

export class ReviewMapper {
  static toDomain(reviewDoc: ReviewDocument): Review {
    const id = reviewDoc._id.toString();

    let userId: string;
    let user: { id: string; username: string; image: string } | undefined;

    const userIdField = reviewDoc.userId;
    if (isPopulatedUser(userIdField)) {
      userId = userIdField._id.toString();
      user = {
        id: userIdField._id.toString(),
        username: userIdField.username,
        image: userIdField.image,
      };
    } else {
      userId = userIdField?.toString();
    }

    let bookId: string = '';
    let book: { id: string; title: string; coverUrl: string } | undefined;

    const bookIdField = reviewDoc.bookId;
    if (bookIdField) {
      if (isPopulatedBook(bookIdField)) {
        bookId = bookIdField._id.toString();
        book = {
          id: bookIdField._id.toString(),
          title: bookIdField.title,
          coverUrl: bookIdField.coverUrl,
        };
      } else {
        bookId = bookIdField.toString();
      }
    }

    return Review.reconstitute({
      id,
      userId,
      bookId,
      content: reviewDoc.content,
      rating: reviewDoc.rating,
      createdAt: reviewDoc.createdAt,
      updatedAt: reviewDoc.updatedAt,
      likesCount: reviewDoc.likesCount,
      likedBy: reviewDoc.likedBy?.map((id) => id.toString()) || [],
      isFlagged: reviewDoc.isFlagged,
      moderationStatus: reviewDoc.moderationStatus || 'pending',
      user,
      book,
    });
  }

  static toPersistence(review: Review): ReviewPersistence {
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
