import { Prisma } from '@/core/database/generated/prisma/client';
import { Post as PostEntity } from '@/modules/posts/domain/posts/entities/post.entity';
import { ModerationStatus } from '@/modules/posts/domain/posts/enums/moderation-status.enum';

export const postRelations = {
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      violationCount: true,
    },
  },
  book: {
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
      author: { select: { name: true, bio: true } },
    },
  },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postRelations;
}>;

function toModerationStatus(value: string): ModerationStatus {
  if (value === 'pending') return ModerationStatus.PENDING;
  if (value === 'approved') return ModerationStatus.APPROVED;
  if (value === 'rejected') return ModerationStatus.REJECTED;
  throw new Error(`Unsupported post moderation status: ${value}`);
}

export class PostMapper {
  static toDomain(
    row: PostWithRelations,
    extra: {
      likesCount?: number;
      commentsCount?: number;
      likedByCurrentUser?: boolean;
    } = {},
  ): PostEntity {
    return PostEntity.reconstitute({
      id: row.id,
      userId: row.userId,
      bookId: row.bookId,
      content: row.content,
      imageUrls: row.imageUrls,
      isDeleted: row.isDeleted,
      isFlagged: row.isFlagged,
      moderationReason: row.moderationReason ?? undefined,
      moderationStatus: toModerationStatus(row.moderationStatus),
      likesCount: extra.likesCount,
      commentsCount: extra.commentsCount,
      likedByCurrentUser: extra.likedByCurrentUser,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
      author: {
        id: row.user.id,
        username: row.user.username,
        email: row.user.email,
        image: row.user.image ?? '',
        violationCount: row.user.violationCount,
      },
      book: row.book
        ? {
            id: row.book.id,
            title: row.book.title,
            slug: row.book.slug,
            coverUrl: row.book.coverUrl,
            authorId: { name: row.book.author.name, bio: row.book.author.bio },
          }
        : undefined,
    });
  }
}
