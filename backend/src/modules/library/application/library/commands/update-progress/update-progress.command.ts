import { Command } from '@nestjs/cqrs';

import { UpdateProgressResult } from '@/modules/library/application/library/commands/update-progress/update-progress.handler';
import type { Actor } from '@/shared/casl/actor';

export class UpdateProgressCommand extends Command<UpdateProgressResult> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly progress: number,
    public readonly monotonic: boolean = false,
  ) {
    super();
  }
}
