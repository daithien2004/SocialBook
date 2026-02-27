import { Book } from "@/domain/books/entities/book.entity";
import { BookListReadModel, GenreSummary } from "@/domain/books/read-models/book-list.read-model";

export class BookResponseDto {
    id: string;
    title: string;
    slug: string;
    authorId: { id: string; name: string };
    chapterCount?: number;
    genres: GenreSummary[];
    description: string;
    publishedYear: string;
    coverUrl: string;
    status: string;
    tags: string[];
    likedBy: string[];
    stats: {
        views: number;
        likes: number;
        chapterCount: number;
        averageRating: number;
        totalRatings: number;
    };
    createdAt: Date;
    updatedAt: Date;

    private constructor(readModel: BookListReadModel & { chapterCount?: number; authorName?: string }) {
        this.id = readModel.id;
        this.title = readModel.title;
        this.slug = readModel.slug;
        this.authorId = {
            id: readModel.authorId,
            name: readModel.authorName || '—'
        };
        this.chapterCount = readModel.chapterCount;
        this.genres = readModel.genres;
        this.description = readModel.description;
        this.publishedYear = readModel.publishedYear;
        this.coverUrl = readModel.coverUrl;
        this.status = readModel.status;
        this.tags = readModel.tags;
        this.likedBy = readModel.likedBy;
        this.stats = {
            views: readModel.stats.views,
            likes: readModel.stats.likes,
            chapterCount: readModel.stats.chapterCount,
            averageRating: 0,
            totalRatings: 0
        };
        this.createdAt = readModel.createdAt;
        this.updatedAt = readModel.updatedAt;
    }

    static fromReadModel(readModel: BookListReadModel & { chapterCount?: number; authorName?: string }): BookResponseDto {
        return new BookResponseDto(readModel);
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
            likedBy: book.likedBy,
            stats: {
                views: book.views,
                likes: book.likes,
                chapterCount: 0
            },
            createdAt: book.createdAt,
            updatedAt: book.updatedAt,
            authorName: book.authorName,
            chapterCount: book.chapterCount
        };
        return new BookResponseDto(readModel);
    }

    static fromArray(readModels: (BookListReadModel & { chapterCount?: number; authorName?: string })[]): BookResponseDto[] {
        return readModels.map(rm => BookResponseDto.fromReadModel(rm));
    }
}
