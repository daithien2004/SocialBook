import { Entity } from '@/shared/domain/entity.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export interface RoomCommentProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  content: string;
  userId: string;
  parentCommentId?: string;
}

export class RoomComment extends Entity<string> {
  private _props: RoomCommentProps;

  private constructor(
    id: string,
    props: RoomCommentProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: RoomCommentProps): RoomComment {
    if (!props.content.trim()) {
      throw new BadRequestDomainException(
        'Nội dung bình luận không được để trống',
      );
    }
    if (props.content.length > 1000) {
      throw new BadRequestDomainException(
        'Comment content too long (max 1000 chars)',
      );
    }
    return new RoomComment(crypto.randomUUID(), props);
  }

  static reconstitute(props: {
    id: string;
    roomId: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
    userId: string;
    parentCommentId?: string;
    createdAt: Date;
    updatedAt: Date;
  }): RoomComment {
    return new RoomComment(
      props.id,
      {
        roomId: props.roomId,
        chapterSlug: props.chapterSlug,
        paragraphId: props.paragraphId,
        content: props.content,
        userId: props.userId,
        parentCommentId: props.parentCommentId,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  editContent(newContent: string): void {
    if (!newContent.trim()) {
      throw new BadRequestDomainException(
        'Nội dung bình luận không được để trống',
      );
    }
    if (newContent.length > 1000) {
      throw new BadRequestDomainException(
        'Comment content too long (max 1000 chars)',
      );
    }
    this._props.content = newContent;
    this.markAsUpdated();
  }

  get roomId(): string {
    return this._props.roomId;
  }
  get chapterSlug(): string {
    return this._props.chapterSlug;
  }
  get paragraphId(): string {
    return this._props.paragraphId;
  }
  get content(): string {
    return this._props.content;
  }
  get userId(): string {
    return this._props.userId;
  }
  get parentCommentId(): string | undefined {
    return this._props.parentCommentId;
  }
}
