import { Command } from '@nestjs/cqrs';
import { TextToSpeech } from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';

export class GenerateChapterAudioCommand extends Command<TextToSpeech> {
  constructor(
    public readonly chapterId: string,
    public readonly forceRegenerate?: boolean,
    public readonly voice?: string,
  ) {
    super();
  }
}
