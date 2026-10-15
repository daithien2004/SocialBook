import { GetChapterAudioQuery } from './get-chapter-audio.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { TextToSpeechReadRepository } from '../../ports/text-to-speech-read.repository';

@QueryHandler(GetChapterAudioQuery)
export class GetChapterAudioHandler implements IQueryHandler<GetChapterAudioQuery> {
  constructor(private readonly readRepository: TextToSpeechReadRepository) {}

  execute(query: GetChapterAudioQuery) {
    return this.readRepository.findCompletedByChapterId(
      query.actor.ability,
      query.chapterId,
    );
  }
}
