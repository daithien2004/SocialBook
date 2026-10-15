import { Command } from '@nestjs/cqrs';

import { RecordReadingTimeResult } from '@/modules/library/application/library/commands/record-reading-time/record-reading-time.handler';
import type { Actor } from '@/shared/casl/actor';

export class RecordReadingTimeCommand extends Command<RecordReadingTimeResult> {
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
