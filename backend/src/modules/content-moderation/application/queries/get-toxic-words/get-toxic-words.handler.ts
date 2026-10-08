import { GetToxicWordsQuery } from './get-toxic-words.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/modules/content-moderation/domain/entities/toxic-word.entity';

@QueryHandler(GetToxicWordsQuery)
export class GetToxicWordsHandler {
  constructor(private readonly toxicWordRepository: IToxicWordRepository) {}

  async execute(): Promise<ToxicWord[]> {
    return this.toxicWordRepository.findAll();
  }
}
