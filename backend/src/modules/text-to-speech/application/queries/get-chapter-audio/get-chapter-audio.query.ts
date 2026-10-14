import { Query } from '@nestjs/cqrs';
import { TextToSpeech } from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';

export class GetChapterAudioQuery extends Query<TextToSpeech | null> {
  constructor(public readonly chapterId: string) {
    super();
  }
}
