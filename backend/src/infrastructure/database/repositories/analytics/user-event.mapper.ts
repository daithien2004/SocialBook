import { UserEvent as UserEventEntity } from '@/domain/analytics/entities/user-event.entity';
import { UserEvent as UserEventSchema } from '@/infrastructure/database/schemas/user-event.schema';
import { Types } from 'mongoose';

export class UserEventMapper {
  static toDomain(raw: any): UserEventEntity {
    return UserEventEntity.reconstitute(
      raw._id.toString(),
      {
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
      },
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(entity: UserEventEntity): any {
    return {
      _id: new Types.ObjectId(entity.id),
      userId: new Types.ObjectId(entity.userId),
      sessionId: entity.sessionId,
      eventType: entity.eventType,
      bookId: entity.bookId ? new Types.ObjectId(entity.bookId) : undefined,
      chapterId: entity.chapterId ? new Types.ObjectId(entity.chapterId) : undefined,
      durationSeconds: entity.durationSeconds,
      progressPercent: entity.progressPercent,
      source: entity.source,
      deviceType: entity.deviceType,
      metadata: entity.metadata,
    };
  }
}
