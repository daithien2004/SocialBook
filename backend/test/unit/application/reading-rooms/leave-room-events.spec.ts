import { beforeEach, describe, expect, it } from '@jest/globals';
import { LeaveRoomHandler } from '@/modules/reading-rooms/application/commands/leave-room/leave-room.handler';
import { LeaveRoomCommand } from '@/modules/reading-rooms/application/commands/leave-room/leave-room.command';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { FakeReadingRoomRepository } from '../../../helpers/fake-reading-room.repository';

describe('LeaveRoomHandler (T8: host and mode state transitions)', () => {
  let useCase: LeaveRoomHandler;
  let mockRepo: FakeReadingRoomRepository;

  beforeEach(() => {
    mockRepo = new FakeReadingRoomRepository();
    useCase = new LeaveRoomHandler(mockRepo);
  });

  it('preserves host and mode when a non-host member leaves', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'sync',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
    });

    room.addMember('member-2');
    mockRepo.seed(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('member-2', room.id.toString()),
    );

    expect(result.roomEnded).toBe(false);
    expect(result.hostId).toBe('host-user');
    expect(result.mode).toBe('sync');
  });

  it('transfers host and changes sync mode when the host leaves', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'sync',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
    });

    room.addMember('member-2');
    mockRepo.seed(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('host-user', room.id.toString()),
    );

    expect(result.hostId).toBe('member-2');
    expect(result.mode).toBe('free');
    expect(result.roomEnded).toBe(false);
  });

  it('flags roomEnded: true when the last member leaves', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
    });

    mockRepo.seed(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('host-user', room.id.toString()),
    );

    expect(result.roomEnded).toBe(true);
    expect(result.status).toBe('ended');
  });

  it('treats leaving when not an active member as an idempotent no-op', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
    });
    mockRepo.seed(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('other-user', room.roomId),
    );

    expect(result.roomEnded).toBe(false);
    expect(result.members).toHaveLength(1);
    expect(mockRepo.savedRooms).toHaveLength(0);
  });
});
