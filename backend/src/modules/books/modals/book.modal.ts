import { Types } from 'mongoose';
import { BookDocument } from '../schemas/book.schema';
import { AuthorDocument } from '../../authors/schemas/author.schema';
import { GenreDocument } from '../../genres/schemas/genre.schema';

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
    author?: { id: string; name: string; bio: string; photoUrl: string };
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
            this.author = {
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
    authorName?: string;

    constructor(book: BookDocument) {
        this.id = (book._id as Types.ObjectId).toString();
        this.title = book.title;
        this.slug = book.slug;
        this.coverUrl = book.coverUrl;
        this.status = book.status;
        this.views = book.views || 0;
        this.likes = book.likes || 0;

        if (book.authorId && typeof book.authorId === 'object') {
            const author = book.authorId as unknown as AuthorDocument;
            this.authorName = author.name;
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
    author?: { id: string; name: string };

    constructor(book: any) {
        this.id = book._id?.toString() || book.id;
        this.title = book.title;
        this.slug = book.slug;
        this.description = book.description;

        const authorData = book.authorId;
        if (authorData && typeof authorData === 'object' && authorData.name) {
            this.author = {
                id: authorData._id?.toString(),
                name: authorData.name,
            };
        }
    }
}
