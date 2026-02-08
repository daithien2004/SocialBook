import { Types } from 'mongoose';

export class Post {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public bookId: string | null, 
    public content: string,
    public imageUrls: string[],
    public isDelete: boolean,
    public isFlagged: boolean,
    public moderationReason: string | undefined,
    public moderationStatus: string | undefined,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public author?: { id: string; username: string; email: string; image: string },
    public book?: { id: string; title: string; coverUrl: string; authorId?: { name: string; bio: string } },
  ) {}

  static create(props: {
    userId: string;
    bookId?: string;
    content: string;
    imageUrls?: string[];
    author?: { id: string; username: string; email: string; image: string };
    book?: { id: string; title: string; coverUrl: string };
  }): Post {
    return new Post(
      new Types.ObjectId().toString(), // Helper for ID generation or let Repo handle? Usually Entity has ID.
      props.userId,
      props.bookId || null,
      props.content,
      props.imageUrls || [],
      false,
      false,
      undefined,
      'pending', // Default schema
      new Date(),
      new Date(),
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
      props.id,
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
      props.book,
    );
  }

  updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  updateImages(imageUrls: string[]): void {
    this.imageUrls = imageUrls;
    this.updatedAt = new Date();
  }

  addImage(url: string): void {
    this.imageUrls.push(url);
    this.updatedAt = new Date();
  }

  removeImage(url: string): void {
    this.imageUrls = this.imageUrls.filter(img => img !== url);
    this.updatedAt = new Date();
  }

  delete(): void {
    this.isDelete = true;
    this.updatedAt = new Date();
  }

  flag(reason: string): void {
    this.isFlagged = true;
    this.moderationReason = reason;
    this.moderationStatus = 'pending';
    this.updatedAt = new Date();
  }

  approve(): void {
    this.isFlagged = false;
    this.moderationStatus = 'approved';
    this.updatedAt = new Date();
  }

  reject(): void {
    this.moderationStatus = 'rejected';
    this.isDelete = true; // Rejecting often implies hiding/deleting
    this.updatedAt = new Date();
  }
}
