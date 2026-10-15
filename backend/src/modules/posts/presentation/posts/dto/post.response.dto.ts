import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PostResult } from '@/modules/posts/application/posts/post.result';

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @ApiProperty()
  isFlagged: boolean;

  @ApiPropertyOptional()
  moderationStatus?: string;

  @ApiPropertyOptional()
  moderationReason?: string;

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];

  @ApiPropertyOptional({ type: Object })
  user?: {
    id: string;
    username: string;
    image?: string;
    violationCount?: number;
  };

  @ApiPropertyOptional({ type: Object })
  book?: {
    id: string;
    title: string;
    slug?: string;
    coverUrl?: string;
    authorId?: { name: string; bio: string };
  };

  @ApiPropertyOptional()
  likesCount?: number;

  @ApiPropertyOptional()
  commentsCount?: number;

  @ApiPropertyOptional()
  likedByCurrentUser?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(post: PostResult, warnings?: string[]) {
    this.id = post.id;
    this.content = post.content;
    this.imageUrls = post.imageUrls;
    this.isFlagged = post.isFlagged;
    this.moderationStatus = post.moderationStatus;
    this.moderationReason = post.moderationReason;
    this.warnings = warnings;
    this.createdAt = post.createdAt;
    this.updatedAt = post.updatedAt;

    if (post.user) {
      this.user = {
        ...post.user,
      };
    }

    if (post.book) {
      this.book = {
        id: post.book.id,
        title: post.book.title,
        slug: post.book.slug,
        coverUrl: post.book.coverUrl,
        authorId: post.book.authorId,
      };
    }

    this.likesCount = post.likesCount;
    this.commentsCount = post.commentsCount;
    this.likedByCurrentUser = post.likedByCurrentUser;
  }

  static fromArray(posts: PostResult[]): PostResponseDto[] {
    return posts.map((post) => new PostResponseDto(post));
  }
}
