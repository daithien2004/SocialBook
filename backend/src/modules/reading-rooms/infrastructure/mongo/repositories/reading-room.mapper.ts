import { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { ReadingRoomDocument } from '../schemas/reading-room.schema';

export class ReadingRoomMapper {
  static toDomain(doc: ReadingRoomDocument): DomainReadingRoom {
    return DomainReadingRoom.reconstitute({
      id: doc._id,
      bookId: doc.bookId,
      hostId: doc.hostId,
      mode: doc.mode,
      status: doc.status as 'active' | 'ended',
      currentChapterSlug: doc.currentChapterSlug,
      maxMembers: doc.maxMembers,
      members: doc.members.map((m) => ({
        userId: m.userId,
        role: m.role as 'host' | 'member',
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      })),
      highlights: (doc.highlights || []).map((h) => ({
        id: h.id,
        userId: h.userId,
        displayName: h.displayName,
        avatarUrl: h.avatarUrl,
        chapterSlug: h.chapterSlug,
        paragraphId: h.paragraphId,
        content: h.content,
        aiInsight: h.aiInsight,
        createdAt: h.createdAt,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      endedAt: doc.endedAt,
      version: doc.version,
    });
  }

  static toPersistence(
    domain: DomainReadingRoom,
  ): Partial<ReadingRoomDocument> {
    return {
      _id: domain.roomId,
      bookId: domain.bookId,
      hostId: domain.hostId,
      mode: domain.mode,
      status: domain.status,
      currentChapterSlug: domain.currentChapterSlug,
      maxMembers: domain.maxMembers,
      members: domain.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      })),
      highlights: domain.highlights.map((h) => ({
        id: h.id!,
        userId: h.userId,
        displayName: h.displayName,
        avatarUrl: h.avatarUrl,
        chapterSlug: h.chapterSlug,
        paragraphId: h.paragraphId,
        content: h.content,
        aiInsight: h.aiInsight,
        createdAt: h.createdAt || new Date(),
      })),

      endedAt: domain.endedAt,
      version: domain.version,
    };
  }
}
