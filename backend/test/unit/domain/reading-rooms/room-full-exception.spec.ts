import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import {
  RoomFullDomainException,
  ConcurrencyException,
} from '@/shared/domain/common-exceptions';

describe('RoomFullDomainException & Concurrency mapping (T9)', () => {
  it('throws RoomFullDomainException when adding member to a full room', () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
      maxMembers: 2, // host + 1 member
    });

    room.addMember('member-2');

    expect(() => room.addMember('member-3')).toThrow(RoomFullDomainException);
    try {
      room.addMember('member-3');
    } catch (err) {
      expect(err).toBeInstanceOf(RoomFullDomainException);
      expect((err as RoomFullDomainException).code).toBe('ROOM_FULL');
      expect((err as RoomFullDomainException).statusCode).toBe(409);
      expect((err as RoomFullDomainException).message).toBe('Phòng đã đầy');
    }
  });

  it('allows active members to not throw when re-checking isMember', () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
      maxMembers: 2,
    });

    room.addMember('member-2');
    // Calling addMember again with existing active member should not throw
    expect(() => room.addMember('member-2')).not.toThrow();
  });

  it('ConcurrencyException has code CONCURRENCY_CONFLICT', () => {
    const err = new ConcurrencyException();
    expect(err.code).toBe('CONCURRENCY_CONFLICT');
    expect(err.statusCode).toBe(409);
  });
});
