import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';
import { UserHighlightDocument } from '../../schemas/user-highlight.schema';
import { Types } from 'mongoose';

export class UserHighlightMapper {
  static toDomain(doc: UserHighlightDocument): UserHighlight {
    return UserHighlight.reconstitute(
      doc._id.toString(),
      {
        userId: doc.userId.toString(),
        bookId: doc.bookId.toString(),
        chapterId: doc.chapterId.toString(),
        paragraphId: doc.paragraphId,
        content: doc.content,
        color: doc.color,
        note: doc.note,
      },
      doc.createdAt,
      doc.updatedAt,
    );
  }

  static toPersistence(entity: UserHighlight): Record<string, unknown> {
    return {
      userId: new Types.ObjectId(entity.userId),
      bookId: new Types.ObjectId(entity.bookId),
      chapterId: new Types.ObjectId(entity.chapterId),
      paragraphId: entity.paragraphId,
      content: entity.content,
      color: entity.color,
      note: entity.note,
    };
  }
}
