import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IChaptersImportPort } from "@/domain/chapters/interfaces/chapters-import.port";

import { StartChaptersImportResult } from '@/domain/chapters/interfaces/chapters-import.port';

export class StartChaptersImportCommand extends Command<StartChaptersImportResult> {
  constructor(
    public readonly bookId: string,
    public readonly chapters: Array<{ title: string; content: string }>,
  ) { super(); }
}
