import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { ReadingRoomApplicationMapper } from '@/application/reading-rooms/mappers/reading-room.mapper';
import { ReadingRoomMapper } from '@/infrastructure/database/repositories/reading-rooms/reading-room.mapper';
import { ReadingRoomDocument } from '@/infrastructure/database/schemas/reading-room.schema';

describe('ReadingRoomMapper & Highlight Denormalization (T10)', () => {
  it('ReadingRoomApplicationMapper.toResult excludes departed members and maps highlight user info', () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      currentChapterSlug: 'chap-1',
      maxMembers: 5,
    });

    room.addMember('member-2');
    room.addMember('member-3');

    // member-2 leaves
    room.removeMember('member-2');

    // Add highlight with denormalized user info
    room.addHighlight({
      userId: 'member-3',
      displayName: 'Alice In Wonderland',
      avatarUrl: 'https://example.com/alice.png',
      chapterSlug: 'chap-1',
      paragraphId: 'p-1',
      content: 'Interesting quote',
    });

    const result = ReadingRoomApplicationMapper.toResult(room);

    // Active members only: host-1 and member-3
    expect(result.members.length).toBe(2);
    expect(result.members.map((m) => m.userId)).toEqual(['host-1', 'member-3']);
    expect(result.membersCount).toBe(2);

    // Highlight has displayName and avatarUrl
    expect(result.highlights.length).toBe(1);
    expect(result.highlights[0].displayName).toBe('Alice In Wonderland');
    expect(result.highlights[0].avatarUrl).toBe('https://example.com/alice.png');
  });

  it('infrastructure ReadingRoomMapper preserves displayName and avatarUrl', () => {
    const doc = {
      _id: 'ROOM0001',
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      status: 'active',
      currentChapterSlug: 'chap-1',
      maxMembers: 5,
      members: [
        { userId: 'host-1', role: 'host', joinedAt: new Date() },
      ],
      highlights: [
        {
          id: 'hl-1',
          userId: 'host-1',
          displayName: 'Host User',
          avatarUrl: 'https://avatar.url',
          chapterSlug: 'chap-1',
          paragraphId: 'p-1',
          content: 'Some highlight',
          createdAt: new Date(),
        },
      ],
      chatMessages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    } as unknown as ReadingRoomDocument;

    const domain = ReadingRoomMapper.toDomain(doc);
    expect(domain.highlights[0].displayName).toBe('Host User');
    expect(domain.highlights[0].avatarUrl).toBe('https://avatar.url');

    const persistence = ReadingRoomMapper.toPersistence(domain);
    expect(persistence.highlights?.[0].displayName).toBe('Host User');
    expect(persistence.highlights?.[0].avatarUrl).toBe('https://avatar.url');
  });
});
