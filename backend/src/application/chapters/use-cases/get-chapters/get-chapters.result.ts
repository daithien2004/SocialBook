export interface ChapterParagraphResult {
    id: string;
    content: string;
}

export interface ChapterResult {
    id: string;
    title: string;
    slug: string;
    bookId: string;
    paragraphs: ChapterParagraphResult[];
    viewsCount: number;
    orderIndex: number;
    wordCount: number;
    characterCount: number;
    contentPreview: string;
    createdAt: Date;
    updatedAt: Date;
}
