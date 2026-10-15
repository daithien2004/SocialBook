import { Command } from '@nestjs/cqrs';

import { ProcessReadingSessionResult } from '@/modules/library/application/library/commands/process-reading-session/process-reading-session.handler';
import type { Actor } from '@/shared/casl/actor';

export class ProcessReadingSessionCommand extends Command<ProcessReadingSessionResult> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly durationInSeconds: number,
  ) {
    super();
  }
}
