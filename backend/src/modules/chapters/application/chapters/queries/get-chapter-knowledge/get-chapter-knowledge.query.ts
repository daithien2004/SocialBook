import { Query } from '@nestjs/cqrs';
import { ChapterKnowledge } from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';

export class GetChapterKnowledgeQuery extends Query<ChapterKnowledge> {
  constructor(
    public readonly chapterId: string,
    public readonly force: boolean = false,
  ) {
    super();
  }
}
