import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GenerateBookAudioResult } from '../../text-to-speech.result';

export class GenerateBookAudioCommand extends Command<GenerateBookAudioResult> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly forceRegenerate?: boolean,
    public readonly voice?: string,
    public readonly speed?: number,
    public readonly language?: string,
    public readonly format?: string,
  ) {
    super();
  }
}
