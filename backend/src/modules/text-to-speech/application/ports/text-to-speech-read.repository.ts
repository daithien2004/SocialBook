import type { AppAbility } from '@/shared/casl/app-ability';
import type { TextToSpeechReadModel } from '../read-models/text-to-speech.read-model';

export abstract class TextToSpeechReadRepository {
  abstract findAccessibleById(
    ability: AppAbility,
    id: string,
  ): Promise<TextToSpeechReadModel | null>;

  abstract findCompletedByChapterId(
    ability: AppAbility,
    chapterId: string,
  ): Promise<TextToSpeechReadModel | null>;
}
