export class Review {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly bookId: string,
    public content: string,
    public rating: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public likesCount: number = 0,
    public likedBy: string[] = [],
    public isFlagged: boolean = false,
    public moderationStatus: string = 'pending',
    public user?: { id: string; username: string; image: string },
    public book?: { id: string; title: string; coverUrl: string }
  ) {}

  static create(props: {
    userId: string;
    bookId: string;
    content: string;
    rating: number;
    moderationStatus?: string;
  }): Review {
    return new Review(
      '',
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
      props.id,
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

  update(content: string, rating: number): void {
    this.content = content;
    this.rating = rating;
    this.updatedAt = new Date();
    this.moderationStatus = 'pending';
  }

  updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
    this.moderationStatus = 'pending';
  }

  updateRating(rating: number): void {
    this.rating = rating;
    this.updatedAt = new Date();
  }
}
