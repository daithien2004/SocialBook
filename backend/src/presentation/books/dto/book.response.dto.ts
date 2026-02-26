import { Book } from "@/domain/books/entities/book.entity";
import { BookListReadModel, GenreSummary } from "@/domain/books/read-models/book-list.read-model";

export class BookResponseDto {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    authorName?: string;
    chapterCount?: number;
    genres: GenreSummary[];
    description: string;
    publishedYear: string;
    coverUrl: string;
    status: string;
    tags: string[];
    views: number;
    likes: number;
    likedBy: string[];
    createdAt: Date;
    updatedAt: Date;

    constructor(readModel: BookListReadModel & { chapterCount?: number; authorName?: string }) {
        this.id = readModel.id;
        this.title = readModel.title;
        this.slug = readModel.slug;
        this.authorId = readModel.authorId;
        this.authorName = readModel.authorName;
        this.chapterCount = readModel.chapterCount;
        this.genres = readModel.genres;
        this.description = readModel.description;
        this.publishedYear = readModel.publishedYear;
        this.coverUrl = readModel.coverUrl;
        this.status = readModel.status;
        this.tags = readModel.tags;
        this.views = readModel.views;
        this.likes = readModel.likes;
        this.likedBy = readModel.likedBy;
        this.createdAt = readModel.createdAt;
        this.updatedAt = readModel.updatedAt;
    }

    static fromEntity(book: Book): BookResponseDto {
        const readModel: BookListReadModel & { chapterCount?: number; authorName?: string } = {
            id: book.id.toString(),
            title: book.title.toString(),
            slug: book.slug,
            authorId: book.authorId.toString(),
            genres: book.genres.map(id => ({
                id: id.toString(),
                name: '',
                slug: ''
            })),
            description: book.description,
            publishedYear: book.publishedYear,
            coverUrl: book.coverUrl,
            status: book.status.toString(),
            tags: book.tags,
            views: book.views,
            likes: book.likes,
            likedBy: book.likedBy,
            createdAt: book.createdAt,
            updatedAt: book.updatedAt,
            authorName: book.authorName,
            chapterCount: book.chapterCount
        };
        return new BookResponseDto(readModel);
    }

    static fromArray(readModels: (BookListReadModel & { chapterCount?: number; authorName?: string })[]): BookResponseDto[] {
        return readModels.map(rm => new BookResponseDto(rm));
    }
}
