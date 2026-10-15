import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { ImportEpubPreviewCommand } from './import-epub-preview.command';
import { Logger } from '@nestjs/common';
import { IEpubParserPort } from '@/modules/chapters/domain/chapters/interfaces/epub-parser.port';
import type { ImportEpubPreviewResult } from './import-epub-preview.result';

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
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'manage',
      'Chapter',
    );
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
