import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '@/modules/comments/domain/entities/comment.entity';
import type { CommentReadModel } from '@/modules/comments/application/read-models/comment.read-model';

export class CommentCountResponseDto {
  @ApiProperty({ type: Number })
  count: number;

  constructor(count: number) {
    this.count = count;
  }
}

export class CommentAuthorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true })
  image: string | null;

  constructor(author: CommentReadModel['user']) {
    this.id = author.id;
    this.username = author.username;
    this.image = author.image;
  }
}

/** Public list view for comments; unlike the command response, this includes author and like state. */
export class CommentListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  targetType: string;

  @ApiProperty({ nullable: true })
  parentId: string | null;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  repliesCount: number;

  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  isFlagged: boolean;

  @ApiProperty()
  moderationStatus: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: CommentAuthorResponseDto })
  user: CommentAuthorResponseDto;

  constructor(model: CommentReadModel) {
    this.id = model.id;
    this.content = model.content;
    this.targetId = model.targetId;
    this.targetType = model.targetType;
    this.parentId = model.parentId;
    this.likesCount = model.likesCount;
    this.repliesCount = model.repliesCount;
    this.isLiked = model.isLiked;
    this.isFlagged = model.isFlagged;
    this.moderationStatus = model.moderationStatus;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;
    this.user = new CommentAuthorResponseDto(model.user);
  }

  static fromReadModels(
    models: CommentReadModel[],
  ): CommentListItemResponseDto[] {
    return models.map((model) => new CommentListItemResponseDto(model));
  }
}

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
