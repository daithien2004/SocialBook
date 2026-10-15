import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAudioByIdQuery } from './get-audio-by-id.query';
import { TextToSpeechReadRepository } from '../../ports/text-to-speech-read.repository';

@QueryHandler(GetAudioByIdQuery)
export class GetAudioByIdHandler implements IQueryHandler<GetAudioByIdQuery> {
  constructor(private readonly readRepository: TextToSpeechReadRepository) {}

  execute(query: GetAudioByIdQuery) {
    return this.readRepository.findAccessibleById(
      query.actor.ability,
      query.id,
    );
  }
}
