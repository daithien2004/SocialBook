import { PostId } from '../value-objects/post-id.vo';
import { Entity } from '../../../shared/domain/entity.base';

export class Post extends Entity<PostId> {
  private constructor(
    id: PostId,
    private _userId: string,
    private _bookId: string | null,
    private _content: string,
    private _imageUrls: string[],
    private _isDelete: boolean,
    private _isFlagged: boolean,
    private _moderationReason: string | undefined,
    private _moderationStatus: string | undefined,
    createdAt: Date,
    updatedAt: Date,
    private _author?: { id: string; username: string; email: string; image: string },
    private _book?: { id: string; title: string; coverUrl: string; authorId?: { name: string; bio: string } }
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(props: {
    userId: string;
    bookId?: string;
    content: string;
    imageUrls?: string[];
    author?: { id: string; username: string; email: string; image: string };
    book?: { id: string; title: string; coverUrl: string };
  }): Post {
    return new Post(
      PostId.generate(),
      props.userId,
      props.bookId || null,
      props.content,
      props.imageUrls || [],
      false,
      false,
      undefined,
      'pending',
      new Date(),
      new Date(),
      props.author,
      props.book
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    bookId: string | null;
    content: string;
    imageUrls: string[];
    isDelete: boolean;
    isFlagged: boolean;
    moderationReason?: string;
    moderationStatus?: string;
    createdAt: Date;
    updatedAt: Date;
    author?: { id: string; username: string; email: string; image: string };
    book?: { id: string; title: string; coverUrl: string; authorId?: { name: string; bio: string } };
  }): Post {
    return new Post(
      PostId.create(props.id),
      props.userId,
      props.bookId,
      props.content,
      props.imageUrls,
      props.isDelete,
      props.isFlagged,
      props.moderationReason,
      props.moderationStatus,
      props.createdAt,
      props.updatedAt,
      props.author,
      props.book
    );
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get bookId(): string | null {
    return this._bookId;
  }

  get content(): string {
    return this._content;
  }

  get imageUrls(): string[] {
    return [...this._imageUrls];
  }

  get isDelete(): boolean {
    return this._isDelete;
  }

  get isFlagged(): boolean {
    return this._isFlagged;
  }

  get moderationReason(): string | undefined {
    return this._moderationReason;
  }

  get moderationStatus(): string | undefined {
    return this._moderationStatus;
  }

  get author(): { id: string; username: string; email: string; image: string } | undefined {
    return this._author;
  }

  get book(): { id: string; title: string; coverUrl: string; authorId?: { name: string; bio: string } } | undefined {
    return this._book;
  }

  // Business methods
  updateContent(content: string): void {
    this._content = content;
    this.markAsUpdated();
  }

  updateImages(imageUrls: string[]): void {
    this._imageUrls = imageUrls;
    this.markAsUpdated();
  }

  addImage(url: string): void {
    this._imageUrls.push(url);
    this.markAsUpdated();
  }

  removeImage(url: string): void {
    this._imageUrls = this._imageUrls.filter(img => img !== url);
    this.markAsUpdated();
  }

  delete(): void {
    this._isDelete = true;
    this.markAsUpdated();
  }

  flag(reason: string): void {
    this._isFlagged = true;
    this._moderationReason = reason;
    this._moderationStatus = 'pending';
    this.markAsUpdated();
  }

  approve(): void {
    this._isFlagged = false;
    this._moderationStatus = 'approved';
    this.markAsUpdated();
  }

  reject(): void {
    this._moderationStatus = 'rejected';
    this._isDelete = true;
    this.markAsUpdated();
  }

  updateBookId(bookId: string | null): void {
    this._bookId = bookId;
    this.markAsUpdated();
  }
}

