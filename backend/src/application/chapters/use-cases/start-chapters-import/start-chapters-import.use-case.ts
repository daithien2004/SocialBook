import { Injectable } from '@nestjs/common';
import { IChaptersImportService } from '@/domain/chapters/interfaces/chapters-import.port';
import { StartChaptersImportCommand } from './start-chapters-import.command';

@Injectable()
export class StartChaptersImportUseCase {
  constructor(private readonly chaptersImportService: IChaptersImportService) {}

  async execute(command: StartChaptersImportCommand) {
    return this.chaptersImportService.startImport({
      bookId: command.bookId,
      chapters: command.chapters,
    });
  }
}
