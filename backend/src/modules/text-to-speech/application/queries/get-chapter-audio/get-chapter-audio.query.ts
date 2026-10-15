import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { TextToSpeechReadModel } from '../../read-models/text-to-speech.read-model';

export class GetChapterAudioQuery extends Query<TextToSpeechReadModel | null> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
  ) {
    super();
  }
}
