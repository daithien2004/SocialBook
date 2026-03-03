import { Chapter } from "@/domain/chapters/entities/chapter.entity";
import { ChapterResult } from "../use-cases/get-chapters/get-chapters.result";

export class ChapterApplicationMapper {
    static toResult(chapter: Chapter): ChapterResult {
        return {
            id: chapter.id.toString(),
            title: chapter.title.toString(),
            slug: chapter.slug,
            bookId: chapter.bookId.toString(),
            paragraphs: chapter.paragraphs.map(p => ({
                id: p.id,
                content: p.content,
            })),
            viewsCount: chapter.viewsCount,
            orderIndex: chapter.orderIndex.getValue(),
            wordCount: chapter.getWordCount(),
            characterCount: chapter.getCharacterCount(),
            contentPreview: chapter.getContentPreview(),
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
        };
    }
}
