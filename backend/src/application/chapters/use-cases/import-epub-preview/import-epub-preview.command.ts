import { Command } from '@nestjs/cqrs';

export class ImportEpubPreviewCommand extends Command<any> {
  constructor(public readonly fileBuffer: Buffer, public readonly fileName: string) { super(); }
}