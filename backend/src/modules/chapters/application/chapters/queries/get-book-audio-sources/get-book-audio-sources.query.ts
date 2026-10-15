import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ChapterAudioSourceReadModel } from '@/modules/chapters/application/read-models/chapter-audio-source.read-model';

export class GetBookAudioSourcesQuery extends Query<
  ChapterAudioSourceReadModel[]
> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly limit: number,
  ) {
    super();
  }
}
