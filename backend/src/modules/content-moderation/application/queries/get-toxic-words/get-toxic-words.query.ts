import { Query } from '@nestjs/cqrs';
import { ToxicWord } from '@/modules/content-moderation/domain/entities/toxic-word.entity';

export class GetToxicWordsQuery extends Query<ToxicWord[]> {
  constructor() {
    super();
  }
}
