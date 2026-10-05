import { GetToxicWordsQuery } from './get-toxic-words.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/domain/content-moderation/entities/toxic-word.entity';

@QueryHandler(GetToxicWordsQuery)
export class GetToxicWordsHandler {
  constructor(private readonly toxicWordRepository: IToxicWordRepository) {}

  async execute(): Promise<ToxicWord[]> {
    return this.toxicWordRepository.findAll();
  }
}
