import { ForbiddenError } from '@casl/ability';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { GetBookAudioSourcesQuery } from './get-book-audio-sources.query';

@QueryHandler(GetBookAudioSourcesQuery)
export class GetBookAudioSourcesHandler implements IQueryHandler<GetBookAudioSourcesQuery> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  execute(query: GetBookAudioSourcesQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'manage',
      'TextToSpeech',
    );
    return this.chapterReadRepository.findAudioSourcesByBookId(
      query.bookId,
      query.limit,
    );
  }
}
