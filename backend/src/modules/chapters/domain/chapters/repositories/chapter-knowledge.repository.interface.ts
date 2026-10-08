import { ChapterKnowledge } from '../entities/chapter-knowledge.entity';

export abstract class IChapterKnowledgeRepository {
  abstract findByChapterId(chapterId: string): Promise<ChapterKnowledge | null>;
  abstract save(knowledge: ChapterKnowledge): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
