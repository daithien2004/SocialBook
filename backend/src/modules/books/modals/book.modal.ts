import { Model, Types } from 'mongoose';
import { BookDocument } from '../infrastructure/schemas/book.schema';
import { AuthorDocument } from '../../authors/infrastructure/schemas/author.schema';
import { GenreDocument } from '../../genres/infrastructure/schemas/genre.schema';

export class BookModal {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverUrl: string;
    status: string;
    publishedYear: string;
    tags: string[];
    views: number;
    likes: number;
    authorId?: { id: string; name: string; bio: string; photoUrl: string };
    genres?: { id: string; name: string; slug: string }[];
    createdAt: Date;
    updatedAt: Date;

    constructor(book: BookDocument) {
        this.id = (book._id as Types.ObjectId).toString();
        this.title = book.title;
        this.slug = book.slug;
        this.description = book.description;
        this.coverUrl = book.coverUrl;
        this.status = book.status;
        this.publishedYear = book.publishedYear;
        this.tags = book.tags || [];
        this.views = book.views || 0;
        this.likes = book.likes || 0;
        this.createdAt = book.createdAt;
        this.updatedAt = book.updatedAt;

        if (book.authorId && typeof book.authorId === 'object') {
            const author = book.authorId as unknown as AuthorDocument;
            this.authorId = {
                id: (author._id as Types.ObjectId).toString(),
                name: author.name,
                bio: author.bio,
                photoUrl: author.photoUrl,
            };
        }

        if (book.genres && Array.isArray(book.genres) && book.genres.length > 0) {
            if (typeof book.genres[0] === 'object') {
                this.genres = (book.genres as unknown as GenreDocument[]).map(genre => ({
                    id: (genre._id as Types.ObjectId).toString(),
                    name: genre.name,
                    slug: genre.slug,
                }));
            }
        }
    }

    static fromArray(books: BookDocument[]): BookModal[] {
        return books.map(book => new BookModal(book));
    }
}

export class BookListModal {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    status: string;
    views: number;
    likes: number;
    authorId?: { id: string; name: string; avatar?: string };
    genres: { id: string; name: string; slug: string }[];
    description: string;
    createdAt: Date;
    updatedAt: Date;
    stats?: { chapters: number; views: number; likes: number; rating?: number; reviews?: number };

    constructor(book: BookDocument) {
        this.id = (book._id as Types.ObjectId).toString();
        this.title = book.title;
        this.slug = book.slug;
        this.coverUrl = book.coverUrl;
        this.status = book.status;
        this.views = book.views || 0;
        this.likes = book.likes || 0;

        this.description = book.description;
        this.createdAt = book.createdAt;

        this.updatedAt = book.updatedAt;

        // Stats from aggregation pipeline
        if ((book as any).stats) {
            this.stats = (book as any).stats;
        }

        if (book.authorId && typeof book.authorId === 'object') {
            const author = book.authorId as unknown as AuthorDocument;
            this.authorId = {
                id: (author._id as Types.ObjectId).toString(),
                name: author.name,
                avatar: author.photoUrl,
            };
        }

        this.genres = [];
        if (book.genres && Array.isArray(book.genres) && book.genres.length > 0) {

            // Handle populated genres
            if (typeof book.genres[0] === 'object') {
                this.genres = (book.genres as unknown as GenreDocument[]).map(g => ({
                    id: (g._id as Types.ObjectId).toString(),
                    name: g.name,
                    slug: g.slug
                }));
            }
        }
    }

    static fromArray(books: BookDocument[]): BookListModal[] {
        return books.map(book => new BookListModal(book));
    }
}

export class BookInfoModal {
    id: string;
    title: string;
    slug: string;
    description?: string;
    authorId?: { id: string; name: string };

    constructor(book: any) {
        this.id = book._id?.toString() || book.id;
        this.title = book.title;
        this.slug = book.slug;
        this.description = book.description;

        const authorData = book.authorId;
        if (authorData && typeof authorData === 'object' && authorData.name) {
            this.authorId = {
                id: authorData._id?.toString(),
                name: authorData.name,
            };
        }
    }
}
