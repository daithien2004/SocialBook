import { Command } from '@nestjs/cqrs';
import type { GenerateBookResult } from './generate-book-audio.handler';

export class GenerateBookAudioCommand extends Command<GenerateBookResult> {
  constructor(
    public readonly bookId: string,
    public readonly forceRegenerate?: boolean,
    public readonly voice?: string,
  ) {
    super();
  }
}
