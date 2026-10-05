import { Command } from '@nestjs/cqrs';

import { RecordReadingTimeResult } from '@/application/library/commands/record-reading-time/record-reading-time.handler';

export class RecordReadingTimeCommand extends Command<RecordReadingTimeResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly durationInSeconds: number,
  ) {
    super();
  }
}
