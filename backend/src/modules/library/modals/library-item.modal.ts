import { Types } from 'mongoose';
import { ReadingListDocument } from '../schemas/reading-list.schema';
import { BookDocument } from '../../books/schemas/book.schema';
import { ChapterDocument } from '../../chapters/schemas/chapter.schema';
import { AuthorDocument } from '../../authors/schemas/author.schema';

export class LibraryItemModal {
    id: string;
    userId: string;
    bookId: any;
    status: string;
    lastReadChapterId?: {
        id: string;
        title: string;
        slug: string;
        orderIndex: number;
    } | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;

    constructor(item: ReadingListDocument) {
        this.id = (item._id as Types.ObjectId).toString();
        this.userId = (item.userId as Types.ObjectId).toString();
        this.status = item.status;
        this.createdAt = item.createdAt;
        this.updatedAt = item.updatedAt;

        // Map collectionIds
        this.collectionIds = item.collectionIds
            ? item.collectionIds.map(id => {
                if (id && typeof id === 'object' && '_id' in id) {
                    return ((id as unknown as { _id: Types.ObjectId })._id as Types.ObjectId).toString();
                }
                return (id as Types.ObjectId).toString();
            })
            : [];

        // Map bookId
        if (item.bookId && typeof item.bookId === 'object' && 'title' in item.bookId) {
            const book = item.bookId as unknown as BookDocument;
            this.bookId = {
                id: book._id ? book._id.toString() : '',
                title: book.title,
                coverUrl: book.coverUrl,
                slug: book.slug,
                status: book.status
            };

            // Map author if it's populated inside book
            if (book.authorId && typeof book.authorId === 'object' && 'name' in book.authorId) {
                const author = book.authorId as unknown as AuthorDocument;
                this.bookId.authorId = {
                    id: author._id ? author._id.toString() : '',
                    name: author.name
                };
            }
        } else {
            this.bookId = item.bookId ? (item.bookId as unknown as Types.ObjectId).toString() : null;
        }

        // Map lastReadChapterId
        if (item.lastReadChapterId && typeof item.lastReadChapterId === 'object' && 'slug' in item.lastReadChapterId) {
            const chapter = item.lastReadChapterId as unknown as ChapterDocument;
            this.lastReadChapterId = {
                id: chapter._id ? chapter._id.toString() : '',
                title: chapter.title,
                slug: chapter.slug,
                orderIndex: chapter.orderIndex
            };
        } else {
            this.lastReadChapterId = null;
        }
    }

    static fromArray(items: ReadingListDocument[]): LibraryItemModal[] {
        return items.map(item => new LibraryItemModal(item));
    }
}
