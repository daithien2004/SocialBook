import { Command } from '@nestjs/cqrs';

import { ProcessReadingSessionResult } from '@/application/library/commands/process-reading-session/process-reading-session.handler';

export class ProcessReadingSessionCommand extends Command<ProcessReadingSessionResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly durationInSeconds: number,
  ) {
    super();
  }
}
