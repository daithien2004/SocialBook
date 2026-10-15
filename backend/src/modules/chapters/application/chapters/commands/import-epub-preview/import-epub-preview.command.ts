import { Command } from '@nestjs/cqrs';
import { ImportEpubPreviewResult } from '@/modules/chapters/application/chapters/commands/import-epub-preview/import-epub-preview.result';
import type { Actor } from '@/shared/casl/actor';

export class ImportEpubPreviewCommand extends Command<ImportEpubPreviewResult> {
  constructor(
    public readonly actor: Actor,
    public readonly fileBuffer: Buffer,
    public readonly fileName: string,
  ) {
    super();
  }
}
