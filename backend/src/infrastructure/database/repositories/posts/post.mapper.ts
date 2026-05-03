import { Post } from '@/domain/posts/entities/post.entity';
import { PostDocument } from '@/infrastructure/database/schemas/post.schema';
import { Types } from 'mongoose';

interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  image: string;
}

interface PopulatedBook {
  _id: Types.ObjectId;
  title: string;
  slug?: string;
  coverUrl: string;
  authorId?: unknown;
}

function isPopulatedUser(field: unknown): field is PopulatedUser {
  return typeof field === 'object' && field !== null && '_id' in field && 'username' in field;
}

function isPopulatedBook(field: unknown): field is PopulatedBook {
  return typeof field === 'object' && field !== null && '_id' in field && 'title' in field;
}

interface PostWithVirtuals extends PostDocument {
  likesCount?: number;
  commentsCount?: number;
  likedByCurrentUser?: boolean;
}

interface PostPersistence {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bookId?: Types.ObjectId;
  content: string;
  imageUrls: string[];
  isDeleted: boolean;
  isFlagged: boolean;
  moderationReason?: string;
  moderationStatus?: string;
}

export class PostMapper {
  static toDomain(postDoc: PostWithVirtuals): Post | null {
    if (!postDoc) return null;

    const id = postDoc._id.toString();

    // Handle userId: could be ObjectId or populated User object
    let userId: string;
    let author:
      | { id: string; username: string; email: string; image: string }
      | undefined;

    const userIdField = postDoc.userId;
    if (isPopulatedUser(userIdField)) {
      userId = userIdField._id.toString();
      author = {
        id: userIdField._id.toString(),
        username: userIdField.username,
        email: userIdField.email,
        image: userIdField.image,
      };
    } else {
      userId = userIdField?.toString() || '';
    }

    // Handle bookId: could be ObjectId or populated Book object
    let bookId: string | null = null;
    let book:
      | {
          id: string;
          title: string;
          slug?: string;
          coverUrl: string;
          authorId?: { name: string; bio: string };
        }
      | undefined;

    const bookIdField = postDoc.bookId;
    if (bookIdField) {
      if (isPopulatedBook(bookIdField)) {
        bookId = bookIdField._id.toString();
        book = {
          id: bookIdField._id.toString(),
          title: bookIdField.title,
          slug: bookIdField.slug,
          coverUrl: bookIdField.coverUrl,
        };
      } else {
        bookId = bookIdField.toString();
      }
    }

    return Post.reconstitute({
      id,
      userId,
      bookId,
      content: postDoc.content,
      imageUrls: postDoc.imageUrls || [],
      isDeleted: postDoc.isDeleted,
      isFlagged: postDoc.isFlagged || false,
      moderationReason: postDoc.moderationReason,
      moderationStatus: postDoc.moderationStatus,
      likesCount: postDoc.likesCount,
      commentsCount: postDoc.commentsCount,
      likedByCurrentUser: postDoc.likedByCurrentUser,
      createdAt: postDoc.createdAt,
      updatedAt: postDoc.updatedAt,
      author,
      book,
    });
  }

  static toPersistence(post: Post): PostPersistence {
    return {
      _id: new Types.ObjectId(post.id),
      userId: new Types.ObjectId(post.userId),
      bookId: post.bookId ? new Types.ObjectId(post.bookId) : undefined,
      content: post.content,
      imageUrls: post.imageUrls,
      isDeleted: post.isDeleted,
      isFlagged: post.isFlagged,
      moderationReason: post.moderationReason,
      moderationStatus: post.moderationStatus,
    };
  }
}
