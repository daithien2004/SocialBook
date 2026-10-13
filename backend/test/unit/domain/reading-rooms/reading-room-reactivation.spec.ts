import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import {
  ForbiddenDomainException,
  InternalServerDomainException,
} from '@/shared/domain/common-exceptions';

type MemberProps = {
  userId: string;
  role: 'host' | 'member';
  joinedAt: Date;
  leftAt?: Date;
};

function createRoom(
  status: 'active' | 'ended',
  members: MemberProps[],
): ReadingRoom {
  return ReadingRoom.reconstitute({
    id: 'ROOM01',
    bookId: '00000000-0000-4000-8000-000000000011',
    currentChapterId: '00000000-0000-4000-8000-000000000015',
    hostId: '00000000-0000-4000-8000-000000000012',
    mode: 'free',
    status,
    currentChapterSlug: 'chapter-1',
    maxMembers: 10,
    members,
    highlights: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    endedAt:
      status === 'ended' ? new Date('2026-01-02T00:00:00.000Z') : undefined,
    version: 3,
  });
}

const hostId = '00000000-0000-4000-8000-000000000012';
const otherUserId = '00000000-0000-4000-8000-000000000014';
const joinedAt = new Date('2026-01-01T00:00:00.000Z');

describe('ReadingRoom.reactivate', () => {
  it('treats a repeated host request for an active room as a no-op', () => {
    const room = createRoom('active', [
      { userId: hostId, role: 'host', joinedAt },
    ]);

    room.reactivate(hostId);

    expect(room.status).toBe('active');
    expect(room.isDirty).toBe(false);
  });

  it('rejects reactivation when the persisted room has no host member record', () => {
    const room = createRoom('ended', [
      { userId: otherUserId, role: 'member', joinedAt },
    ]);

    expect(() => {
      room.reactivate(hostId);
    }).toThrow(InternalServerDomainException);
  });

  it('restores the host membership when reopening an ended room', () => {
    const room = createRoom('ended', [
      { userId: hostId, role: 'host', joinedAt, leftAt: new Date() },
    ]);

    room.reactivate(hostId);

    expect(room.status).toBe('active');
    expect(room.endedAt).toBeUndefined();
    expect(room.isMember(hostId)).toBe(true);
    expect(room.members[0].role).toBe('host');
    expect(room.isDirty).toBe(true);
  });

  it('checks host authorization before room state', () => {
    const room = createRoom('active', [
      { userId: hostId, role: 'host', joinedAt },
    ]);

    expect(() => {
      room.reactivate(otherUserId);
    }).toThrow(ForbiddenDomainException);
  });
});
