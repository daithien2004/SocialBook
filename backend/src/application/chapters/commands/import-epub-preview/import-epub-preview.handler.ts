import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ImportEpubPreviewCommand } from './import-epub-preview.command';
import { Logger } from '@nestjs/common';
import {
  IEpubParserPort,
  ParsedChapter,
} from '@/domain/chapters/interfaces/epub-parser.port';

export interface ImportEpubPreviewResult {
  chapters: ParsedChapter[];
  totalChapters: number;
}

@CommandHandler(ImportEpubPreviewCommand)
export class ImportEpubPreviewHandler implements ICommandHandler<
  ImportEpubPreviewCommand,
  ImportEpubPreviewResult
> {
  private readonly logger = new Logger(ImportEpubPreviewHandler.name);

  constructor(private readonly epubParser: IEpubParserPort) {}

  async execute(
    command: ImportEpubPreviewCommand,
  ): Promise<ImportEpubPreviewResult> {
    try {
      this.logger.log(`Parsing EPUB file: ${command.fileName}`);
      const chapters = await this.epubParser.parseEpub(
        command.fileBuffer,
        command.fileName,
      );

      this.logger.log(`Parsed ${chapters.length} chapters from EPUB`);

      return {
        chapters,
        totalChapters: chapters.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse EPUB file: ${command.fileName}`,
        error,
      );
      throw error;
    }
  }
}
