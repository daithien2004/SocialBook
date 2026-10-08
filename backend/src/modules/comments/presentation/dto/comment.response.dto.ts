import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '@/modules/comments/domain/entities/comment.entity';

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  targetType: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty({ nullable: true })
  parentId: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  isFlagged: boolean;

  @ApiProperty()
  moderationReason: string;

  @ApiProperty()
  moderationStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  contentPreview: string;

  @ApiProperty()
  wordCount: number;

  @ApiProperty()
  characterCount: number;

  @ApiProperty()
  isReply: boolean;

  @ApiProperty()
  isTopLevel: boolean;

  constructor(comment: Comment) {
    this.id = comment.id.toString();

    this.targetType = comment.targetType.toString();
    this.targetId = comment.targetId.toString();
    this.parentId = comment.parentId?.toString() || null;
    this.content = comment.content.toString();
    this.likesCount = comment.likesCount;
    this.isFlagged = comment.isFlagged;
    this.moderationReason = comment.moderationReason;
    this.moderationStatus = comment.moderationStatus.toString();
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.contentPreview = comment.getContentPreview();
    this.wordCount = comment.getWordCount();
    this.characterCount = comment.getCharacterCount();
    this.isReply = comment.isReply();
    this.isTopLevel = comment.isTopLevel();
  }

  static fromArray(comments: Comment[]): CommentResponseDto[] {
    return comments.map((comment) => new CommentResponseDto(comment));
  }
}

export class CommentWithRepliesDto {
  constructor(comment: Comment, replies: Comment[] = []) {
    this.comment = new CommentResponseDto(comment);
    this.replies = replies.map((reply) => new CommentResponseDto(reply));
    this.totalReplies = replies.length;
  }

  comment: CommentResponseDto;
  replies: CommentResponseDto[];
  totalReplies: number;
}

export class CommentStatsDto {
  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  pendingModeration: number;

  @ApiProperty()
  approvedComments: number;

  @ApiProperty()
  rejectedComments: number;

  @ApiProperty()
  flaggedComments: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'integer' } })
  commentsByType: Record<string, number>;

  constructor(
    totalComments: number,
    pendingModeration: number,
    approvedComments: number,
    rejectedComments: number,
    flaggedComments: number,
    commentsByType: Record<string, number>,
  ) {
    this.totalComments = totalComments;
    this.pendingModeration = pendingModeration;
    this.approvedComments = approvedComments;
    this.rejectedComments = rejectedComments;
    this.flaggedComments = flaggedComments;
    this.commentsByType = commentsByType;
  }
}
