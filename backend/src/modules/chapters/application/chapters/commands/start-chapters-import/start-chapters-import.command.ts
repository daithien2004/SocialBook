import { Command } from '@nestjs/cqrs';

import { StartChaptersImportResult } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';

export class StartChaptersImportCommand extends Command<StartChaptersImportResult> {
  constructor(
    public readonly bookId: string,
    public readonly chapters: Array<{ title: string; content: string }>,
  ) {
    super();
  }
}
