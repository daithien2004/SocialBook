import { LeaveRoomUseCase } from '@/application/reading-rooms/use-cases/leave-room/leave-room.use-case';
import { LeaveRoomCommand } from '@/application/reading-rooms/use-cases/leave-room/leave-room.command';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { RoomMode } from '@/domain/reading-rooms/value-objects/room-mode.vo';

describe('LeaveRoomUseCase (T8: accurate host & mode change tracking)', () => {
  let useCase: LeaveRoomUseCase;
  let mockRepo: jest.Mocked<IReadingRoomRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation((room) => Promise.resolve(room)),
    } as unknown as jest.Mocked<IReadingRoomRepository>;

    useCase = new LeaveRoomUseCase(mockRepo);
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
