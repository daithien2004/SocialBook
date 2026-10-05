import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ReadingProgressTracker } from '@/presentation/gateways/reading-progress.tracker';
import { UpdateProgressCommand } from '@/application/library/commands/update-progress/update-progress.command';
import type { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import type { Chapter } from '@/domain/chapters/entities/chapter.entity';
import type { RoomSocket } from '@/presentation/gateways/reading-room.types';
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
  let findById: jest.Mock;
  let execute: jest.Mock<unknown, [UpdateProgressCommand]>;
  let socket: RoomSocket;

  const chapterOf = (bookId: string): Chapter =>
    fakeOf<Chapter>({
      bookId: { toString: () => bookId },
    });

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

    findById = jest.fn();
    execute = jest.fn().mockResolvedValue({});
    tracker = new ReadingProgressTracker(
      fakeOf<IChapterRepository>({ findById }),
      fakeOf<CommandBus>({ execute }),
    );
    socket = makeSocket();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves progress using the chapterId the client sent', async () => {
    findById.mockResolvedValue(chapterOf(BOOK_ID));

    await scheduleAndFlush();

    expect(findById).toHaveBeenCalledTimes(1);
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

  it('verifies the chapter once and reuses the cache on later flushes', async () => {
    findById.mockResolvedValue(chapterOf(BOOK_ID));

    await scheduleAndFlush();
    await scheduleAndFlush(BOOK_ID, CHAPTER_ID, 60);

    expect(findById).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('re-verifies when the socket moves to a room holding another book', async () => {
    findById.mockResolvedValue(chapterOf(BOOK_ID));

    await scheduleAndFlush();
    await scheduleAndFlush(OTHER_BOOK_ID);

    expect(findById).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed verification — the next flush retries', async () => {
    findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(chapterOf(BOOK_ID));

    await scheduleAndFlush();
    expect(execute).not.toHaveBeenCalled();

    await scheduleAndFlush();
    expect(findById).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('refuses a chapterId that belongs to another book', async () => {
    findById.mockResolvedValue(chapterOf(OTHER_BOOK_ID));

    await scheduleAndFlush();

    expect(execute).not.toHaveBeenCalled();
    expect(socket.data.verifiedChapters?.has(CHAPTER_ID)).toBeFalsy();
  });

  it('refuses a chapterId that does not exist', async () => {
    findById.mockResolvedValue(null);

    await scheduleAndFlush();

    expect(execute).not.toHaveBeenCalled();
  });

  it('never queries the DB for a chapterId that is not a valid ObjectId', async () => {
    await scheduleAndFlush(BOOK_ID, 'khong-phai-object-id');

    expect(findById).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('logs but does not throw when the progress write fails', async () => {
    findById.mockResolvedValue(chapterOf(BOOK_ID));
    execute.mockImplementation(() => Promise.reject(new Error('db down')));
    const errorSpy = jest.spyOn(Logger.prototype, 'error');

    await expect(scheduleAndFlush()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('flushes pending progress and leaves no stale cache on socket data', async () => {
    findById.mockResolvedValue(chapterOf(BOOK_ID));

    await scheduleAndFlush();

    expect(socket.data.pendingProgress).toBeUndefined();
    expect(socket.data.progressTimer).toBeUndefined();

    // flush lần nữa không gửi lại tiến độ cũ
    await tracker.flush(socket);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is nothing pending', async () => {
    await tracker.flush(socket);

    expect(findById).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('does not write progress for an unauthenticated socket', async () => {
    socket = makeSocket('');
    findById.mockResolvedValue(chapterOf(BOOK_ID));

    await scheduleAndFlush();

    expect(execute).not.toHaveBeenCalled();
  });
});
