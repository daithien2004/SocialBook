import { BookDetailReadModel, ChapterSummary } from '@/domain/books/read-models/book-detail.read-model';

export class ChapterResponseDto {
    id: string;
    title: string;
    slug: string;
    content: string;
    orderIndex: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt?: Date;

    constructor(chapter: ChapterSummary) {
        this.id = chapter.id;
        this.title = chapter.title;
        this.slug = chapter.slug;
        this.content = chapter.content;
        this.orderIndex = chapter.orderIndex;
        this.viewsCount = chapter.viewsCount;
        this.createdAt = chapter.createdAt;
        this.updatedAt = chapter.updatedAt;
    }
}

export class BookDetailResponseDto {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    genres: { id: string; name: string; slug: string }[];
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
    chapters: ChapterResponseDto[];

    constructor(readModel: BookDetailReadModel) {
        this.id = readModel.id;
        this.title = readModel.title;
        this.slug = readModel.slug;
        this.authorId = readModel.authorId;
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
        this.chapters = readModel.chapters.map(ch => new ChapterResponseDto(ch));
    }
}
