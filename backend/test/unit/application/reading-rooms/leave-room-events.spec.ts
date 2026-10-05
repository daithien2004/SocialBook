import { LeaveRoomHandler } from '@/application/reading-rooms/commands/leave-room/leave-room.handler';
import { LeaveRoomCommand } from '@/application/reading-rooms/commands/leave-room/leave-room.command';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';

describe('LeaveRoomHandler (T8: accurate host & mode change tracking)', () => {
  let useCase: LeaveRoomHandler;
  let mockRepo: jest.Mocked<IReadingRoomRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation((room) => Promise.resolve(room)),
    } as unknown as jest.Mocked<IReadingRoomRepository>;

    useCase = new LeaveRoomHandler(mockRepo);
  });

  it('keeps hostChanged: false and modeChanged: false when a non-host member leaves', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'sync',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
    });

    room.addMember('member-2');
    mockRepo.findById.mockResolvedValue(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('member-2', room.id.toString()),
    );

    expect(result.hostChanged).toBe(false);
    expect(result.modeChanged).toBe(false);
    expect(result.roomEnded).toBe(false);
    expect(result.hostId).toBe('host-user');
  });

  it('flags hostChanged: true and modeChanged: true when host leaves a sync room', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'sync',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
    });

    room.addMember('member-2');
    mockRepo.findById.mockResolvedValue(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('host-user', room.id.toString()),
    );

    expect(result.hostChanged).toBe(true);
    expect(result.hostId).toBe('member-2');
    expect(result.modeChanged).toBe(true);
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

    mockRepo.findById.mockResolvedValue(room);

    const result = await useCase.execute(
      new LeaveRoomCommand('host-user', room.id.toString()),
    );

    expect(result.roomEnded).toBe(true);
    expect(result.status).toBe('ended');
  });
});
