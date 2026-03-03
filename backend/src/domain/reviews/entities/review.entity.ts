import { Entity } from '@/shared/domain/entity.base';

export class Review extends Entity<string> {
    private constructor(
        id: string,
        public readonly userId: string,
        public readonly bookId: string,
        private _content: string,
        private _rating: number,
        private _likesCount: number,
        private _likedBy: string[],
        private _isFlagged: boolean,
        private _moderationStatus: string,
        createdAt?: Date,
        updatedAt?: Date,
        public user?: { id: string; username: string; image: string },
        public book?: { id: string; title: string; coverUrl: string }
    ) {
        super(id, createdAt, updatedAt);
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
            props.userId,
            props.bookId,
            props.content,
            props.rating,
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
            props.likesCount,
            props.likedBy,
            props.isFlagged,
            props.moderationStatus,
            props.createdAt,
            props.updatedAt,
            props.user,
            props.book
        );
    }

    get content(): string { return this._content; }
    get rating(): number { return this._rating; }
    get likesCount(): number { return this._likesCount; }
    get likedBy(): string[] { return [...this._likedBy]; }
    get isFlagged(): boolean { return this._isFlagged; }
    get moderationStatus(): string { return this._moderationStatus; }

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
}
