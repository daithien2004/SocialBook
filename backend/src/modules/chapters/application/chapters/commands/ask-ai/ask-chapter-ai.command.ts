import { Command } from '@nestjs/cqrs';
import type { AskChapterAiResult } from './ask-chapter-ai.result';
import type { Actor } from '@/shared/casl/actor';

export class AskChapterAICommand extends Command<AskChapterAiResult> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
    public readonly bookSlug: string,
    public readonly userId: string,
    public readonly question: string,
  ) {
    super();
  }
}
