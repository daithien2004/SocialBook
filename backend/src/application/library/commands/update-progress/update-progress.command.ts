import { Command } from '@nestjs/cqrs';

import { UpdateProgressResult } from '@/application/library/commands/update-progress/update-progress.handler';

export class UpdateProgressCommand extends Command<UpdateProgressResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly progress: number,
    public readonly monotonic: boolean = false,
  ) {
    super();
  }
}
