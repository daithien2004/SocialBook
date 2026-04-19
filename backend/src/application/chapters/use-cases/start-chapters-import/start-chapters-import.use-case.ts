import { Injectable } from '@nestjs/common';
import { ChaptersImportService } from '@/infrastructure/queues/chapters-import/chapters-import.service';
import { StartChaptersImportCommand } from './start-chapters-import.command';

@Injectable()
export class StartChaptersImportUseCase {
  constructor(private readonly chaptersImportService: ChaptersImportService) {}

  async execute(command: StartChaptersImportCommand) {
    return this.chaptersImportService.startImport({
      bookId: command.bookId,
      chapters: command.chapters,
    });
  }
}
