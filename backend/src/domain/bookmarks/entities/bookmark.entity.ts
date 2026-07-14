import { Entity } from '@/shared/domain/entity.base';

export interface BookmarkProps {
  userId: string;
  bookId: string;
  chapterId: string;
  chapterSlug: string;
  paragraphId: string;
  textPreview: string;
}

export class Bookmark extends Entity<string> {
  private _props: BookmarkProps;

  private constructor(
    id: string,
    props: BookmarkProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(id: string, props: BookmarkProps): Bookmark {
    return new Bookmark(id, {
      ...props,
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    bookId: string;
    chapterId: string;
    chapterSlug: string;
    paragraphId: string;
    textPreview: string;
    createdAt: Date;
    updatedAt: Date;
  }): Bookmark {
    return new Bookmark(
      props.id,
      {
        userId: props.userId,
        bookId: props.bookId,
        chapterId: props.chapterId,
        chapterSlug: props.chapterSlug,
        paragraphId: props.paragraphId,
        textPreview: props.textPreview,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): string {
    return this._props.userId;
  }

  get bookId(): string {
    return this._props.bookId;
  }

  get chapterId(): string {
    return this._props.chapterId;
  }

  get chapterSlug(): string {
    return this._props.chapterSlug;
  }

  get paragraphId(): string {
    return this._props.paragraphId;
  }

  get textPreview(): string {
    return this._props.textPreview;
  }
}
