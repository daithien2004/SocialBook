import { Query } from '@nestjs/cqrs';
import { ToxicWord } from '@/domain/content-moderation/entities/toxic-word.entity';

export class GetToxicWordsQuery extends Query<ToxicWord[]> {
  constructor() {
    super();
  }
}
