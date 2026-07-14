import { Injectable } from '@nestjs/common';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/domain/content-moderation/entities/toxic-word.entity';

@Injectable()
export class GetToxicWordsUseCase {
  constructor(private readonly toxicWordRepository: IToxicWordRepository) {}

  async execute(): Promise<ToxicWord[]> {
    return this.toxicWordRepository.findAll();
  }
}
