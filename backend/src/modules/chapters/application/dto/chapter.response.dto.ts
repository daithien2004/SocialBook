import { Chapter } from '../../domain/entities/chapter.entity';

export class ChapterResponseDto {
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
}
