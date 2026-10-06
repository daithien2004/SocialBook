import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ReadingProgressTracker } from '@/presentation/gateways/reading-room/reading-progress.tracker';
import { UpdateProgressCommand } from '@/application/library/commands/update-progress/update-progress.command';
import type { RoomSocket } from '@/presentation/gateways/reading-room/reading-room.types';
import { fakeOf } from '../../support/typed-fake';

/**
 * Refactor CQRS tách logic ghi tiến độ đọc ra `ReadingProgressTracker`
 * (trước đây nằm trong gateway `handleHeartbeat`/`handleDisconnect`).
 * Test bám vào đúng lớp đó, không dựng cả gateway nữa.
 */
const CHAPTER_ID = '66f1a2b3c4d5e6f7a8b9c0d1';
const OTHER_BOOK_ID = 'book-2';
const BOOK_ID = 'book-1';

describe('ReadingProgressTracker (chapterId path)', () => {
  let tracker: ReadingProgressTracker;
  let execute: jest.Mock<unknown, [UpdateProgressCommand]>;
  let socket: RoomSocket;

  const makeSocket = (userId = 'user-1'): RoomSocket =>
    fakeOf<RoomSocket>({
      id: 'socket-1',
      data: { userId, role: 'user', roomId: 'room-1', bookId: BOOK_ID },
      rooms: new Set(['room:room-1']),
      emit: jest.fn(),
    });

  const scheduleAndFlush = async (
    bookId = BOOK_ID,
    chapterId = CHAPTER_ID,
    progress = 50,
  ): Promise<void> => {
    tracker.schedule(socket, bookId, chapterId, progress);
    await tracker.flush(socket);
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    execute = jest.fn().mockResolvedValue({});
    tracker = new ReadingProgressTracker(fakeOf<CommandBus>({ execute }));
    socket = makeSocket();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves progress using the chapterId the client sent', async () => {
    await scheduleAndFlush();

    expect(execute).toHaveBeenCalledTimes(1);

    const command = execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(UpdateProgressCommand);
    expect(command).toMatchObject({
      userId: 'user-1',
      bookId: BOOK_ID,
      chapterId: CHAPTER_ID,
      progress: 50,
      monotonic: true,
    });
  });

  it('logs but does not throw when the progress write fails', async () => {
    execute.mockImplementation(() => Promise.reject(new Error('db down')));
    const errorSpy = jest.spyOn(Logger.prototype, 'error');

    await expect(scheduleAndFlush()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('flushes pending progress and clears internal state', async () => {
    await scheduleAndFlush();

    // flush lần nữa không gửi lại tiến độ cũ
    await tracker.flush(socket);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is nothing pending', async () => {
    await tracker.flush(socket);

    expect(execute).not.toHaveBeenCalled();
  });

  it('does not write progress for an unauthenticated socket', async () => {
    socket = makeSocket('');

    await scheduleAndFlush();

    expect(execute).not.toHaveBeenCalled();
  });
});
