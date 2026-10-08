import { Command } from '@nestjs/cqrs';
import { ImportEpubPreviewResult } from '@/modules/chapters/application/chapters/commands/import-epub-preview/import-epub-preview.handler';

export class ImportEpubPreviewCommand extends Command<ImportEpubPreviewResult> {
  constructor(
    public readonly fileBuffer: Buffer,
    public readonly fileName: string,
  ) {
    super();
  }
}
