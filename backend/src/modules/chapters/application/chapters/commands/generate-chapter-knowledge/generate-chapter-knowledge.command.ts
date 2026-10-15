import { Command } from '@nestjs/cqrs';
import type { ChapterKnowledgeResult } from './generate-chapter-knowledge.result';
import type { Actor } from '@/shared/casl/actor';

export class GenerateChapterKnowledgeCommand extends Command<ChapterKnowledgeResult> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
    public readonly force = false,
  ) {
    super();
  }
}
