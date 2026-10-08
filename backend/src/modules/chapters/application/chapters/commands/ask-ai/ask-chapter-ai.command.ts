import { Command } from '@nestjs/cqrs';

export class AskChapterAICommand extends Command<{
  answer: string;
  createdAt: Date;
}> {
  constructor(
    public readonly chapterId: string,
    public readonly bookSlug: string,
    public readonly userId: string,
    public readonly question: string,
  ) {
    super();
  }
}
