import { Chapter } from "@/domain/chapters/entities/chapter.entity";

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

    constructor(chapter: Chapter) {
        this.id = chapter.id.toString();
        this.title = chapter.title.toString();
        this.slug = chapter.slug;
        this.bookId = chapter.bookId.toString();
        this.paragraphs = chapter.paragraphs.map(p => ({
            id: p.id,
            content: p.content
        }));
        this.viewsCount = chapter.viewsCount;
        this.orderIndex = chapter.orderIndex.getValue();
        this.wordCount = chapter.getWordCount();
        this.characterCount = chapter.getCharacterCount();
        this.contentPreview = chapter.getContentPreview();
        this.createdAt = chapter.createdAt;
        this.updatedAt = chapter.updatedAt;
    }

    static fromDomain(chapter: Chapter): ChapterResponseDto {
        return new ChapterResponseDto(chapter);
    }

    static fromArray(chapters: Chapter[]): ChapterResponseDto[] {
        return chapters.map(chapter => new ChapterResponseDto(chapter));
    }
}

