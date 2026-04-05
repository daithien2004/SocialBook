import { Injectable, Logger } from '@nestjs/common';
import type {
  ParsedChapter,
} from '@/domain/chapters/interfaces/epub-parser.interface';
import { EpubParserService } from '@/infrastructure/external/epub-parser.service';

export interface ImportEpubPreviewResult {
  chapters: ParsedChapter[];
  totalChapters: number;
}

@Injectable()
export class ImportEpubPreviewUseCase {
  private readonly logger = new Logger(ImportEpubPreviewUseCase.name);

  constructor(private readonly epubParserService: EpubParserService) {}

  async execute(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ImportEpubPreviewResult> {
    try {
      this.logger.log(`Parsing EPUB file: ${fileName}`);
      const chapters = await this.epubParserService.parseEpub(fileBuffer, fileName);

      this.logger.log(`Parsed ${chapters.length} chapters from EPUB`);

      return {
        chapters,
        totalChapters: chapters.length,
      };
    } catch (error) {
      this.logger.error(`Failed to parse EPUB file: ${fileName}`, error);
      throw error;
    }
  }
}
