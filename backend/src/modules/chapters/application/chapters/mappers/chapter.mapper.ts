import { Chapter } from '@/modules/chapters/domain/chapters/entities/chapter.entity';
import { ChapterKnowledge } from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import type { ChapterKnowledgeResult } from '../commands/generate-chapter-knowledge/generate-chapter-knowledge.result';

export class ChapterApplicationMapper {
  static toReadModel(chapter: Chapter): ChapterReadModel {
    return {
      id: chapter.id.toString(),
      title: chapter.title.toString(),
      slug: chapter.slug,
      bookId: chapter.bookId.toString(),
      paragraphs: chapter.paragraphs.map((p) => ({
        id: p.id,
        content: p.content,
      })),
      viewsCount: chapter.viewsCount,
      orderIndex: chapter.orderIndex.getValue(),
      characterCount: chapter.getCharacterCount(),
      contentPreview: chapter.getContentPreview(),
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  static toKnowledgeResult(
    knowledge: ChapterKnowledge,
  ): ChapterKnowledgeResult {
    return {
      id: knowledge.id,
      chapterId: knowledge.chapterId,
      entities: knowledge.entities,
      relationships: knowledge.relationships,
      summary: knowledge.summary,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
    };
  }
}
