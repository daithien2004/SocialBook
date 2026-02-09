import { BookId } from '../value-objects/book-id.vo';
import { BookTitle } from '../value-objects/book-title.vo';
import { BookStatus } from '../value-objects/book-status.vo';
import { AuthorId } from '../value-objects/author-id.vo';
import { GenreId } from '../value-objects/genre-id.vo';
import { Entity } from '../../../shared/domain/entity.base';
import slugify from 'slugify';

export class Book extends Entity<BookId> {
    private constructor(
        id: BookId,
        private _title: BookTitle,
        private _slug: string,
        private _authorId: AuthorId,
        private _genres: GenreId[],
        private _description: string,
        private _publishedYear: string,
        private _coverUrl: string,
        private _status: BookStatus,
        private _tags: string[],
        private _views: number,
        private _likes: number,
        private _likedBy: string[],
        createdAt: Date,
        updatedAt: Date,
        public readonly genreObjects?: { id: string; name: string; slug: string; }[]
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        title: string;
        authorId: string;
        genres: string[];
        description?: string;
        publishedYear?: string;
        coverUrl?: string;
        status?: 'draft' | 'published' | 'completed';
        tags?: string[];
    }): Book {
        const title = BookTitle.create(props.title);
        const slug = Book.generateSlug(props.title);
        const authorId = AuthorId.create(props.authorId);
        const genres = props.genres.map(id => GenreId.create(id));
        const status = props.status ? BookStatus.create(props.status) : BookStatus.draft();

        return new Book(
            BookId.generate(),
            title,
            slug,
            authorId,
            genres,
            props.description?.trim() || '',
            props.publishedYear?.trim() || '',
            props.coverUrl?.trim() || '',
            status,
            props.tags || [],
            0,
            0,
            [],
            new Date(),
            new Date(),
            undefined
        );
    }

    static reconstitute(props: {
        id: string;
        title: string;
        slug: string;
        authorId: string;
        genres: string[];
        description: string;
        publishedYear: string;
        coverUrl: string;
        status: 'draft' | 'published' | 'completed';
        tags: string[];
        views: number;
        likes: number;
        likedBy: string[];
        createdAt: Date;
        updatedAt: Date;
        genreObjects?: { id: string; name: string; slug: string; }[];
    }): Book {
        return new Book(
            BookId.create(props.id),
            BookTitle.create(props.title),
            props.slug,
            AuthorId.create(props.authorId),
            props.genres.map(id => GenreId.create(id)),
            props.description,
            props.publishedYear,
            props.coverUrl,
            BookStatus.create(props.status),
            props.tags,
            props.views,
            props.likes,
            props.likedBy,
            props.createdAt,
            props.updatedAt,
            props.genreObjects
        );
    }

    // Getters
    get title(): BookTitle {
        return this._title;
    }

    get slug(): string {
        return this._slug;
    }

    get authorId(): AuthorId {
        return this._authorId;
    }

    get genres(): GenreId[] {
        return [...this._genres];
    }

    get description(): string {
        return this._description;
    }

    get publishedYear(): string {
        return this._publishedYear;
    }

    get coverUrl(): string {
        return this._coverUrl;
    }

    get status(): BookStatus {
        return this._status;
    }

    get tags(): string[] {
        return [...this._tags];
    }

    get views(): number {
        return this._views;
    }

    get likes(): number {
        return this._likes;
    }

    get likedBy(): string[] {
        return [...this._likedBy];
    }

    // Business methods
    changeTitle(newTitle: string): void {
        const title = BookTitle.create(newTitle);
        this._title = title;
        this._slug = Book.generateSlug(newTitle);
        this.markAsUpdated();
    }

    changeAuthor(newAuthorId: string): void {
        this._authorId = AuthorId.create(newAuthorId);
        this.markAsUpdated();
    }

    updateGenres(newGenres: string[]): void {
        if (newGenres.length === 0) {
            throw new Error('Book must have at least one genre');
        }
        if (newGenres.length > 5) {
            throw new Error('Book cannot have more than 5 genres');
        }
        this._genres = newGenres.map(id => GenreId.create(id));
        this.markAsUpdated();
    }

    updateDescription(description: string): void {
        this._description = description.trim();
        this.markAsUpdated();
    }

    updatePublishedYear(publishedYear: string): void {
        this._publishedYear = publishedYear.trim();
        this.markAsUpdated();
    }

    updateCoverUrl(coverUrl: string): void {
        this._coverUrl = coverUrl.trim();
        this.markAsUpdated();
    }

    changeStatus(newStatus: 'draft' | 'published' | 'completed'): void {
        this._status = BookStatus.create(newStatus);
        this.markAsUpdated();
    }

    updateTags(tags: string[]): void {
        this._tags = tags;
        this.markAsUpdated();
    }

    incrementViews(): void {
        this._views += 1;
        this.markAsUpdated();
    }

    incrementLikes(): void {
        this._likes += 1;
        this.markAsUpdated();
    }

    decrementLikes(): void {
        if (this._likes > 0) {
            this._likes -= 1;
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

    private static generateSlug(title: string): string {
        return slugify(title, {
            lower: true,
            strict: true,
            locale: 'vi'
        });
    }
}

