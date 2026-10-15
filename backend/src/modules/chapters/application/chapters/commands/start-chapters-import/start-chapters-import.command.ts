import { Command } from '@nestjs/cqrs';

import { StartChaptersImportResult } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';
import type { Actor } from '@/shared/casl/actor';

export class StartChaptersImportCommand extends Command<StartChaptersImportResult> {
  constructor(
    public readonly actor: Actor,
    public readonly idempotencyKey: string,
    public readonly bookId: string,
    public readonly chapters: Array<{ title: string; content: string }>,
  ) {
    super();
  }
}
