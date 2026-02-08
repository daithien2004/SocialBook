import { Book } from "@/domain/books/entities/book.entity";

export class BookResponseDto {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    genres: any[];
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

    constructor(book: Book) {
        this.id = book.id.toString();
        this.title = book.title.toString();
        this.slug = book.slug;
        this.authorId = book.authorId.toString();
        this.genres = book.genreObjects ? book.genreObjects : book.genres.map(genre => genre.toString());
        this.description = book.description;
        this.publishedYear = book.publishedYear;
        this.coverUrl = book.coverUrl;
        this.status = book.status.toString();
        this.tags = book.tags;
        this.views = book.views;
        this.likes = book.likes;
        this.likedBy = book.likedBy;
        this.createdAt = book.createdAt;
        this.updatedAt = book.updatedAt;
    }

    static fromArray(books: Book[]): BookResponseDto[] {
        return books.map(book => new BookResponseDto(book));
    }
}

