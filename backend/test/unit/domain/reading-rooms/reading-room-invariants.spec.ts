import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import {
  ReadingRoomFullError,
  ReadingRoomInvalidError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';

describe('ReadingRoom domain invariants', () => {
  it('enforces the member limit and does not add an active member twice', () => {
    const room = createRoom({ maxMembers: 2 });
    room.addMember('member-1');

    expect(() => {
      room.addMember('member-2');
    }).toThrow(ReadingRoomFullError);

    room.addMember('member-1');
    expect(room.activeMembers.map((member) => member.userId)).toEqual([
      'host-1',
      'member-1',
    ]);
  });

  it('transfers the host and switches a synchronized room to free mode', () => {
    const room = createRoom();
    room.addMember('member-1');

    room.removeMember('host-1');

    expect(room.hostId).toBe('member-1');
    expect(room.mode).toBe('free');
    expect(room.isMember('host-1')).toBe(false);
    expect(room.isHost('member-1')).toBe(true);
  });

  it('ends the room when its final active member leaves', () => {
    const room = createRoom();

    room.removeMember('host-1');

    expect(room.status).toBe('ended');
    expect(room.endedAt).toBeInstanceOf(Date);
    expect(room.activeMembers).toHaveLength(0);
  });

  it('normalizes valid highlights and rejects invalid chapter slugs', () => {
    const room = createRoom();
    const highlight = room.addHighlight({
      userId: 'host-1',
      chapterSlug: 'chapter-one',
      paragraphId: 'paragraph-1',
      content: '  A highlighted passage  ',
    });

    expect(highlight.content).toBe('A highlighted passage');
    expect(highlight.id).toBeTruthy();
    expect(() =>
      room.addHighlight({
        userId: 'host-1',
        chapterSlug: 'invalid slug',
        paragraphId: 'paragraph-2',
        content: 'Another passage',
      }),
    ).toThrow(ReadingRoomInvalidError);
  });
});

function createRoom(options?: { maxMembers?: number }): ReadingRoom {
  return ReadingRoom.create({
    bookId: '00000000-0000-4000-8000-000000000011',
    currentChapterId: '00000000-0000-4000-8000-000000000015',
    hostId: 'host-1',
    mode: 'sync',
    currentChapterSlug: 'chapter-one',
    maxMembers: options?.maxMembers,
  });
}
