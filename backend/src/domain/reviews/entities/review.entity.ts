import { Entity } from '@/shared/domain/entity.base';

export interface ReviewProps {
    userId: string;
    bookId: string;
    content: string;
    rating: number;
    likesCount: number;
    likedBy: string[];
    isFlagged: boolean;
    moderationStatus: string;
    user?: { id: string; username: string; image: string };
    book?: { id: string; title: string; coverUrl: string };
}

export class Review extends Entity<string> {
    private _props: ReviewProps;

    private constructor(id: string, props: ReviewProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: string;
        userId: string;
        bookId: string;
        content: string;
        rating: number;
        moderationStatus?: string;
    }): Review {
        return new Review(
            props.id,
            {
                userId: props.userId,
                bookId: props.bookId,
                content: props.content,
                rating: props.rating,
                likesCount: 0,
                likedBy: [],
                isFlagged: false,
                moderationStatus: props.moderationStatus || 'pending'
            }
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
            {
                userId: props.userId,
                bookId: props.bookId,
                content: props.content,
                rating: props.rating,
                likesCount: props.likesCount,
                likedBy: props.likedBy,
                isFlagged: props.isFlagged,
                moderationStatus: props.moderationStatus,
                user: props.user,
                book: props.book
            },
            props.createdAt,
            props.updatedAt
        );
    }

    get userId(): string { return this._props.userId; }
    get bookId(): string { return this._props.bookId; }
    get content(): string { return this._props.content; }
    get rating(): number { return this._props.rating; }
    get likesCount(): number { return this._props.likesCount; }
    get likedBy(): string[] { return [...this._props.likedBy]; }
    get isFlagged(): boolean { return this._props.isFlagged; }
    get moderationStatus(): string { return this._props.moderationStatus; }
    get user(): { id: string; username: string; image: string } | undefined { return this._props.user; }
    get book(): { id: string; title: string; coverUrl: string } | undefined { return this._props.book; }

    update(content: string, rating: number): void {
        this._props.content = content;
        this._props.rating = rating;
        this._props.moderationStatus = 'pending';
        this.markAsUpdated();
    }

    updateContent(content: string): void {
        this._props.content = content;
        this._props.moderationStatus = 'pending';
        this.markAsUpdated();
    }

    updateRating(rating: number): void {
        this._props.rating = rating;
        this.markAsUpdated();
    }
}
