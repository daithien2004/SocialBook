import { ReviewId } from '../value-objects/review-id.vo';
import { Entity } from '../../../shared/domain/entity.base';

export class Review extends Entity<ReviewId> {
  private constructor(
    id: ReviewId,
    private _userId: string,
    private _bookId: string,
    private _content: string,
    private _rating: number,
    createdAt: Date,
    updatedAt: Date,
    private _likesCount: number,
    private _likedBy: string[],
    private _isFlagged: boolean,
    private _moderationStatus: string,
    private _user?: { id: string; username: string; image: string },
    private _book?: { id: string; title: string; coverUrl: string }
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(props: {
    userId: string;
    bookId: string;
    content: string;
    rating: number;
    moderationStatus?: string;
  }): Review {
    return new Review(
      ReviewId.generate(),
      props.userId,
      props.bookId,
      props.content,
      props.rating,
      new Date(),
      new Date(),
      0,
      [],
      false,
      props.moderationStatus || 'pending'
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    bookId: string;
    content: string;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
    likesCount: number;
    likedBy: string[];
    isFlagged: boolean;
    moderationStatus: string;
    user?: { id: string; username: string; image: string };
    book?: { id: string; title: string; coverUrl: string };
  }): Review {
    return new Review(
      ReviewId.create(props.id),
      props.userId,
      props.bookId,
      props.content,
      props.rating,
      props.createdAt,
      props.updatedAt,
      props.likesCount,
      props.likedBy,
      props.isFlagged,
      props.moderationStatus,
      props.user,
      props.book
    );
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get bookId(): string {
    return this._bookId;
  }

  get content(): string {
    return this._content;
  }

  get rating(): number {
    return this._rating;
  }

  get likesCount(): number {
    return this._likesCount;
  }

  get likedBy(): string[] {
    return [...this._likedBy];
  }

  get isFlagged(): boolean {
    return this._isFlagged;
  }

  get moderationStatus(): string {
    return this._moderationStatus;
  }

  get user(): { id: string; username: string; image: string } | undefined {
    return this._user;
  }

  get book(): { id: string; title: string; coverUrl: string } | undefined {
    return this._book;
  }

  // Business methods
  update(content: string, rating: number): void {
    this._content = content;
    this._rating = rating;
    this._moderationStatus = 'pending';
    this.markAsUpdated();
  }

  updateContent(content: string): void {
    this._content = content;
    this._moderationStatus = 'pending';
    this.markAsUpdated();
  }

  updateRating(rating: number): void {
    this._rating = rating;
    this.markAsUpdated();
  }

  incrementLikes(): void {
    this._likesCount += 1;
    this.markAsUpdated();
  }

  decrementLikes(): void {
    if (this._likesCount > 0) {
      this._likesCount -= 1;
      this.markAsUpdated();
    }
  }

  addLike(userId: string): void {
    if (!this._likedBy.includes(userId)) {
      this._likedBy.push(userId);
      this.incrementLikes();
    }
  }

  removeLike(userId: string): void {
    const index = this._likedBy.indexOf(userId);
    if (index > -1) {
      this._likedBy.splice(index, 1);
      this.decrementLikes();
    }
  }

  flag(): void {
    this._isFlagged = true;
    this.markAsUpdated();
  }

  approve(): void {
    this._moderationStatus = 'approved';
    this._isFlagged = false;
    this.markAsUpdated();
  }

  reject(): void {
    this._moderationStatus = 'rejected';
    this.markAsUpdated();
  }
}

