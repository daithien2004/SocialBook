import { Post } from '../../domain/entities/post.entity';
import { PostDocument } from '../schemas/post.schema';
import { Types } from 'mongoose';

export class PostMapper {
  static toDomain(postDoc: PostDocument): Post | null {
    if (!postDoc) return null;

    const id = postDoc._id.toString();
    
    // Handle userId: could be ObjectId or populated User object
    let userId: string;
    let author: { id: string; username: string; email: string; image: string } | undefined;

    if (postDoc.userId && typeof postDoc.userId === 'object' && 'username' in postDoc.userId) {
        // Populated
        const userObj = postDoc.userId as any;
        userId = userObj._id.toString();
        author = {
            id: userObj._id.toString(),
            username: userObj.username,
            email: userObj.email,
            image: userObj.image
        };
    } else {
        userId = postDoc.userId?.toString() || '';
    }

    // Handle bookId: could be ObjectId or populated Book object
    let bookId: string | null = null;
    let book: { id: string; title: string; coverUrl: string; authorId?: { name: string; bio: string } } | undefined;

    if (postDoc.bookId) {
        if (typeof postDoc.bookId === 'object' && 'title' in postDoc.bookId) {
             // Populated
             const bookObj = postDoc.bookId as any;
             bookId = bookObj._id.toString();
             book = {
                 id: bookObj._id.toString(),
                 title: bookObj.title,
                 coverUrl: bookObj.coverUrl,
                 authorId: bookObj.authorId // Keep as is if populated further
             };
        } else {
             bookId = postDoc.bookId.toString();
        }
    }

    return Post.reconstitute({
      id,
      userId,
      bookId,
      content: postDoc.content,
      imageUrls: postDoc.imageUrls || [],
      isDelete: postDoc.isDelete,
      isFlagged: postDoc.isFlagged || false,
      moderationReason: postDoc.moderationReason,
      moderationStatus: postDoc.moderationStatus,
      createdAt: postDoc.createdAt,
      updatedAt: postDoc.updatedAt,
      author,
      book
    });
  }

  static toPersistence(post: Post): any {
    return {
      _id: new Types.ObjectId(post.id),
      userId: new Types.ObjectId(post.userId),
      bookId: post.bookId ? new Types.ObjectId(post.bookId) : undefined,
      content: post.content,
      imageUrls: post.imageUrls,
      isDelete: post.isDelete,
      isFlagged: post.isFlagged,
      moderationReason: post.moderationReason,
      moderationStatus: post.moderationStatus,
    };
  }
}
