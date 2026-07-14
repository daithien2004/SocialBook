import { UserEvent as UserEventEntity } from '@/domain/analytics/entities/user-event.entity';
import { UserEvent } from '@/infrastructure/database/schemas/user-event.schema';
import { Types, FlattenMaps } from 'mongoose';

type UserEventLean = FlattenMaps<UserEvent> & { _id: Types.ObjectId };

export class UserEventMapper {
  static toDomain(raw: UserEventLean): UserEventEntity {
    return UserEventEntity.reconstitute({
      id: raw._id.toString(),
      userId: raw.userId.toString(),
      sessionId: raw.sessionId,
      eventType: raw.eventType,
      bookId: raw.bookId?.toString(),
      chapterId: raw.chapterId?.toString(),
      durationSeconds: raw.durationSeconds,
      progressPercent: raw.progressPercent,
      source: raw.source,
      deviceType: raw.deviceType,
      metadata: raw.metadata,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: UserEventEntity): Record<string, unknown> {
    return {
      _id: new Types.ObjectId(entity.id),
      userId: new Types.ObjectId(entity.userId),
      sessionId: entity.sessionId,
      eventType: entity.eventType,
      bookId: entity.bookId ? new Types.ObjectId(entity.bookId) : undefined,
      chapterId: entity.chapterId
        ? new Types.ObjectId(entity.chapterId)
        : undefined,
      durationSeconds: entity.durationSeconds,
      progressPercent: entity.progressPercent,
      source: entity.source,
      deviceType: entity.deviceType,
      metadata: entity.metadata,
    };
  }
}
