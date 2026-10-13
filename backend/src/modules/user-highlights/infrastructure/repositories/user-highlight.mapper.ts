import { UserHighlight as UserHighlightEntity } from '@/modules/user-highlights/domain/entities/user-highlight.entity';
import { UserHighlight as PrismaUserHighlight } from '@/core/database/generated/prisma/client';

export const UserHighlightMapper = {
  toDomain(row: PrismaUserHighlight): UserHighlightEntity {
    return UserHighlightEntity.reconstitute(
      row.id,
      {
        userId: row.userId,
        bookId: row.bookId,
        chapterId: row.chapterId,
        paragraphId: row.paragraphId,
        content: row.content,
        color: row.color,
        note: row.note ?? undefined,
      },
      row.createdAt,
      row.updatedAt,
    );
  },

  toCreateInput(highlight: UserHighlightEntity) {
    return {
      id: highlight.id,
      userId: highlight.userId,
      bookId: highlight.bookId,
      chapterId: highlight.chapterId,
      paragraphId: highlight.paragraphId,
      content: highlight.content,
      color: highlight.color,
      note: highlight.note ?? null,
      createdAt: highlight.createdAt,
      updatedAt: highlight.updatedAt,
    };
  },
};
