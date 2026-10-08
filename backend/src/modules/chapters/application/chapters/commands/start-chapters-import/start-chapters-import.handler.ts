import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StartChaptersImportCommand } from './start-chapters-import.command';
import { IChaptersImportPort } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';

@CommandHandler(StartChaptersImportCommand)
export class StartChaptersImportHandler implements ICommandHandler<StartChaptersImportCommand> {
  constructor(private readonly chaptersImportQueue: IChaptersImportPort) {}

  async execute(command: StartChaptersImportCommand) {
    return this.chaptersImportQueue.startImport({
      bookId: command.bookId,
      chapters: command.chapters,
    });
  }
}
