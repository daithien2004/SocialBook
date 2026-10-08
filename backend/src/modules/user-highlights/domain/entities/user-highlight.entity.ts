import { Entity } from '@/shared/domain/entity.base';

export interface UserHighlightProps {
  userId: string;
  bookId: string;
  chapterId: string;
  paragraphId: string;
  content: string;
  color: string;
  note?: string;
}

export class UserHighlight extends Entity<string> {
  private _props: UserHighlightProps;

  private constructor(
    id: string,
    props: UserHighlightProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: Omit<UserHighlightProps, 'id'>): UserHighlight {
    const id = new Date().getTime().toString(); // Temporary id generation, normally replaced by DB ObjectId or UUID
    return new UserHighlight(id, props);
  }

  static reconstitute(
    id: string,
    props: UserHighlightProps,
    createdAt: Date,
    updatedAt: Date,
  ): UserHighlight {
    return new UserHighlight(id, props, createdAt, updatedAt);
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

  get paragraphId(): string {
    return this._props.paragraphId;
  }

  get content(): string {
    return this._props.content;
  }

  get color(): string {
    return this._props.color;
  }

  get note(): string | undefined {
    return this._props.note;
  }

  updateNote(note: string): void {
    this._props.note = note;
    this.markAsUpdated();
  }

  updateColor(color: string): void {
    this._props.color = color;
    this.markAsUpdated();
  }
}
