import { Like as LikeEntity } from '@/modules/likes/domain/entities/like.entity';
import { Like } from '@/core/database/generated/prisma/client';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';

function toTargetType(value: string): TargetType {
  switch (value) {
    case 'post':
      return TargetType.POST;
    case 'comment':
      return TargetType.COMMENT;
    case 'book':
      return TargetType.BOOK;
    case 'chapter':
      return TargetType.CHAPTER;
    default:
      throw new Error(`Unsupported like target type: ${value}`);
  }
}

export class LikeMapper {
  static toDomain(row: Like): LikeEntity {
    return LikeEntity.reconstitute({
      id: row.id,
      userId: row.userId,
      targetId: row.targetId,
      targetType: toTargetType(row.targetType),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
