import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { StartChaptersImportCommand } from './start-chapters-import.command';
import { IChaptersImportPort } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';

@CommandHandler(StartChaptersImportCommand)
export class StartChaptersImportHandler implements ICommandHandler<StartChaptersImportCommand> {
  constructor(private readonly chaptersImportQueue: IChaptersImportPort) {}

  async execute(command: StartChaptersImportCommand) {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'manage',
      'Chapter',
    );
    return this.chaptersImportQueue.startImport({
      actorId: command.actor.userId,
      idempotencyKey: command.idempotencyKey,
      bookId: command.bookId,
      chapters: command.chapters,
    });
  }
}
