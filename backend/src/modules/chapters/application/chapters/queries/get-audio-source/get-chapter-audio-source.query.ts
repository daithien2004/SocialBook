import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ChapterAudioSourceReadModel } from '@/modules/chapters/application/read-models/chapter-audio-source.read-model';

export class GetChapterAudioSourceQuery extends Query<ChapterAudioSourceReadModel | null> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
  ) {
    super();
  }
}
