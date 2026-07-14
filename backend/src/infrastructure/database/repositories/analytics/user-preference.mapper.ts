import { UserPreference as UserPreferenceEntity } from '@/domain/analytics/entities/user-preference.entity';
import { UserPreference } from '@/infrastructure/database/schemas/user-preference.schema';
import { Types, FlattenMaps } from 'mongoose';

type UserPreferenceLean = FlattenMaps<UserPreference> & { _id: Types.ObjectId };

export class UserPreferenceMapper {
  static toDomain(raw: UserPreferenceLean): UserPreferenceEntity {
    return UserPreferenceEntity.reconstitute(
      raw._id.toString(),
      {
        userId: raw.userId.toString(),
        genreId: raw.genreId.toString(),
        score: raw.score,
      },
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(entity: UserPreferenceEntity): Record<string, unknown> {
    return {
      _id: new Types.ObjectId(entity.id),
      userId: new Types.ObjectId(entity.userId),
      genreId: new Types.ObjectId(entity.genreId),
      score: entity.score,
    };
  }
}
