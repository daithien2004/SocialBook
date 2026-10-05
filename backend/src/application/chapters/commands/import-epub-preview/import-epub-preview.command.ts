import { Command } from '@nestjs/cqrs';
import { IEpubParserPort, ParsedChapter } from "@/domain/chapters/interfaces/epub-parser.port";
import { ImportEpubPreviewResult } from "@/application/chapters/commands/import-epub-preview/import-epub-preview.handler";

export class ImportEpubPreviewCommand extends Command<ImportEpubPreviewResult> {
  constructor(public readonly fileBuffer: Buffer, public readonly fileName: string) { super(); }
}