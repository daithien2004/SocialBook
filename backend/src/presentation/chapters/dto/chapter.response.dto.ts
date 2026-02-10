import { ChapterResult } from "@/application/chapters/use-cases/get-chapters/get-chapters.result";

export class ChapterResponseDto {
    id: string;
    title: string;
    slug: string;
    bookId: string;
    paragraphs: Array<{ id: string; content: string }>;
    viewsCount: number;
    orderIndex: number;
    wordCount: number;
    characterCount: number;
    contentPreview: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(chapter: ChapterResult) {
        this.id = chapter.id;
        this.title = chapter.title;
        this.slug = chapter.slug;
        this.bookId = chapter.bookId;
        this.paragraphs = chapter.paragraphs.map(p => ({
            id: p.id,
            content: p.content
        }));
        this.viewsCount = chapter.viewsCount;
        this.orderIndex = chapter.orderIndex;
        this.wordCount = chapter.wordCount;
        this.characterCount = chapter.characterCount;
        this.contentPreview = chapter.contentPreview;
        this.createdAt = chapter.createdAt;
        this.updatedAt = chapter.updatedAt;
    }

    static fromResult(chapter: ChapterResult): ChapterResponseDto {
        return new ChapterResponseDto(chapter);
    }

    static fromArray(chapters: ChapterResult[]): ChapterResponseDto[] {
        return chapters.map(chapter => new ChapterResponseDto(chapter));
    }
}

