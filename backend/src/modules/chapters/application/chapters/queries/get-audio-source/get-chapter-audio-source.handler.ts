import { ForbiddenError } from '@casl/ability';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { GetChapterAudioSourceQuery } from './get-chapter-audio-source.query';

@QueryHandler(GetChapterAudioSourceQuery)
export class GetChapterAudioSourceHandler implements IQueryHandler<GetChapterAudioSourceQuery> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  execute(query: GetChapterAudioSourceQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'manage',
      'TextToSpeech',
    );
    return this.chapterReadRepository.findAudioSourceById(query.chapterId);
  }
}
