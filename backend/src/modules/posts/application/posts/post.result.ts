import type { Post } from '@/modules/posts/domain/posts/entities/post.entity';

export interface PostResult {
  id: string;
  content: string;
  imageUrls: string[];
  isFlagged: boolean;
  moderationStatus?: string;
  moderationReason?: string;
  user?: {
    id: string;
    username: string;
    image?: string;
    violationCount?: number;
  };
  book?: {
    id: string;
    title: string;
    slug?: string;
    coverUrl?: string;
    authorId?: { name: string; bio: string };
  };
  likesCount?: number;
  commentsCount?: number;
  likedByCurrentUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostModerationStatsResult {
  total: number;
  toxic: number;
  spoiler: number;
  other: number;
}

export class PostResultMapper {
  static fromDomain(post: Post): PostResult {
    return {
      id: post.id,
      content: post.content,
      imageUrls: post.imageUrls,
      isFlagged: post.isFlagged,
      moderationStatus: post.moderationStatus,
      moderationReason: post.moderationReason,
      user: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
            image: post.author.image,
            violationCount: post.author.violationCount,
          }
        : undefined,
      book: post.book
        ? {
            id: post.book.id,
            title: post.book.title,
            slug: post.book.slug,
            coverUrl: post.book.coverUrl,
            authorId: post.book.authorId,
          }
        : undefined,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      likedByCurrentUser: post.likedByCurrentUser,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  static fromDomainArray(posts: readonly Post[]): PostResult[] {
    return posts.map((post) => this.fromDomain(post));
  }
}
