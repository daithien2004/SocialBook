import { ToxicWord as ToxicWordEntity } from '@/modules/content-moderation/domain/entities/toxic-word.entity';
import { ToxicWord as PrismaToxicWord } from '@/core/database/generated/prisma/client';

export const ToxicWordMapper = {
  toDomain(row: PrismaToxicWord): ToxicWordEntity {
    return ToxicWordEntity.reconstitute({
      id: row.id,
      pattern: row.pattern,
      group: row.group,
      originalWord: row.originalWord,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toCreateInput(word: ToxicWordEntity) {
    return {
      id: word.id,
      pattern: word.pattern,
      group: word.group,
      originalWord: word.originalWord,
      createdAt: word.createdAt,
      updatedAt: word.updatedAt,
    };
  },
};
