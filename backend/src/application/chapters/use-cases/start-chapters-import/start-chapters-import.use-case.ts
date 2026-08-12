import { Injectable } from '@nestjs/common';
import { IChaptersImportPort } from '@/domain/chapters/interfaces/chapters-import.port';
import { StartChaptersImportCommand } from './start-chapters-import.command';

@Injectable()
export class StartChaptersImportUseCase {
  constructor(private readonly chaptersImportQueue: IChaptersImportPort) {}

  async execute(command: StartChaptersImportCommand) {
    return this.chaptersImportQueue.startImport({
      bookId: command.bookId,
      chapters: command.chapters,
    });
  }
}
