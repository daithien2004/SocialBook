import { Entity } from '@/shared/domain/entity.base';
import { ModerationStatus } from '../enums/moderation-status.enum';

export interface PostProps {
  userId: string;
  bookId: string | null;
  content: string;
  imageUrls: string[];
  isDeleted: boolean;
  isFlagged: boolean;
  moderationReason?: string;
  moderationStatus?: ModerationStatus;
  likesCount?: number;
  commentsCount?: number;
  likedByCurrentUser?: boolean;
  author?: { id: string; username: string; email: string; image: string };
  book?: {
    id: string;
    title: string;
    slug?: string;
    coverUrl: string;
    authorId?: { name: string; bio: string };
  };
}

export class Post extends Entity<string> {
  private _props: PostProps;

  private constructor(
    id: string,
    props: PostProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: string;
    userId: string;
    bookId?: string;
    content: string;
    imageUrls?: string[];
    author?: { id: string; username: string; email: string; image: string };
    book?: { id: string; title: string; slug?: string; coverUrl: string };
  }): Post {
    return new Post(props.id, {
      userId: props.userId,
      bookId: props.bookId || null,
      content: props.content,
      imageUrls: props.imageUrls || [],
      isDeleted: false,
      isFlagged: false,
      moderationReason: undefined,
      moderationStatus: ModerationStatus.PENDING,
      likesCount: 0,
      commentsCount: 0,
      likedByCurrentUser: false,
      author: props.author,
      book: props.book,
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    bookId: string | null;
    content: string;
    imageUrls: string[];
    isDeleted: boolean;
    isFlagged: boolean;
    moderationReason?: string;
    moderationStatus?: ModerationStatus;
    likesCount?: number;
    commentsCount?: number;
    likedByCurrentUser?: boolean;
    createdAt: Date;
    updatedAt: Date;
    author?: { id: string; username: string; email: string; image: string };
    book?: {
      id: string;
      title: string;
      slug?: string;
      coverUrl: string;
      authorId?: { name: string; bio: string };
    };
  }): Post {
    return new Post(
      props.id,
      {
        userId: props.userId,
        bookId: props.bookId,
        content: props.content,
        imageUrls: props.imageUrls,
        isDeleted: props.isDeleted,
        isFlagged: props.isFlagged,
        moderationReason: props.moderationReason,
        moderationStatus: props.moderationStatus,
        likesCount: props.likesCount,
        commentsCount: props.commentsCount,
        likedByCurrentUser: props.likedByCurrentUser,
        author: props.author,
        book: props.book,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): string {
    return this._props.userId;
  }
  get bookId(): string | null {
    return this._props.bookId;
  }
  get content(): string {
    return this._props.content;
  }
  get imageUrls(): string[] {
    return [...this._props.imageUrls];
  }
  get isDeleted(): boolean {
    return this._props.isDeleted;
  }
  get isFlagged(): boolean {
    return this._props.isFlagged;
  }
  get moderationReason(): string | undefined {
    return this._props.moderationReason;
  }
  get moderationStatus(): ModerationStatus | undefined {
    return this._props.moderationStatus;
  }
  get likesCount(): number | undefined {
    return this._props.likesCount;
  }
  get commentsCount(): number | undefined {
    return this._props.commentsCount;
  }
  get likedByCurrentUser(): boolean | undefined {
    return this._props.likedByCurrentUser;
  }
  get author():
    | { id: string; username: string; email: string; image: string }
    | undefined {
    return this._props.author;
  }
  get book():
    | {
        id: string;
        title: string;
        slug?: string;
        coverUrl: string;
        authorId?: { name: string; bio: string };
      }
    | undefined {
    return this._props.book;
  }

  updateContent(content: string): void {
    this._props.content = content;
    this.markAsUpdated();
  }

  updateImages(imageUrls: string[]): void {
    this._props.imageUrls = imageUrls;
    this.markAsUpdated();
  }

  addImage(url: string): void {
    this._props.imageUrls.push(url);
    this.markAsUpdated();
  }

  removeImage(url: string): void {
    this._props.imageUrls = this._props.imageUrls.filter((img) => img !== url);
    this.markAsUpdated();
  }

  delete(): void {
    this._props.isDeleted = true;
    this.markAsUpdated();
  }

  flag(reason: string): void {
    this._props.isFlagged = true;
    this._props.moderationReason = reason;
    this._props.moderationStatus = ModerationStatus.PENDING;
    this.markAsUpdated();
  }

  approve(): void {
    this._props.isFlagged = false;
    this._props.moderationStatus = ModerationStatus.APPROVED;
    this.markAsUpdated();
  }

  clearModeration(): void {
    this._props.isFlagged = false;
    this._props.moderationReason = undefined;
    this._props.moderationStatus = undefined;
    this.markAsUpdated();
  }

  updateBookId(bookId: string): void {
    this._props.bookId = bookId;
    this.markAsUpdated();
  }

  reject(): void {
    this._props.moderationStatus = ModerationStatus.REJECTED;
    this._props.isDeleted = true;
    this.markAsUpdated();
  }
}
