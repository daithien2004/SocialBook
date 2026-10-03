import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';
import type { SocketData } from '@/presentation/gateways/reading-room.types';

const CHAPTER_ID = '66f1a2b3c4d5e6f7a8b9c0d1';
const OTHER_BOOK_ID = '66f1a2b3c4d5e6f7a8b9c0d2';

type FakeSocket = {
  data: SocketData;
  rooms: Set<string>;
  leave: jest.Mock;
};

describe('ReadingRoomGateway reading progress (chapterId path)', () => {
  let gateway: ReadingRoomGateway;
  let chapterRepository: { findById: jest.Mock };
  let updateProgress: { execute: jest.Mock };
  let leaveRoom: { execute: jest.Mock };
  let presenceService: {
    upsertPresence: jest.Mock;
    getRoomPresences: jest.Mock;
    removePresence: jest.Mock;
  };
  let socket: FakeSocket;
  let warn: jest.SpyInstance;

  const heartbeat = async (overrides: Record<string, unknown> = {}) => {
    await gateway.handleHeartbeat(socket as never, socket.data, {
      roomId: 'room-1',
      chapterSlug: 'chuong-1',
      chapterId: CHAPTER_ID,
      progress: 50,
      ...overrides,
    });
    await jest.advanceTimersByTimeAsync(10_000);
  };

  beforeEach(() => {
    jest.useFakeTimers();

    chapterRepository = { findById: jest.fn() };
    updateProgress = { execute: jest.fn().mockResolvedValue({}) };
    leaveRoom = {
      execute: jest.fn().mockResolvedValue({
        hostChanged: false,
        modeChanged: false,
        roomEnded: false,
      }),
    };
    presenceService = {
      upsertPresence: jest.fn().mockResolvedValue(undefined),
      getRoomPresences: jest.fn().mockResolvedValue([]),
      removePresence: jest.fn().mockResolvedValue(undefined),
    };

    const redis = {
      get: jest.fn().mockResolvedValue(null),
      multi: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'],
          [null, 1],
        ]),
      })),
    };

    gateway = new ReadingRoomGateway(
      {} as never, // JwtService
      {} as never, // ConfigService
      presenceService as never,
      {} as never, // JoinRoomUseCase
      leaveRoom as never, // LeaveRoomUseCase
      {} as never, // ChangeChapterUseCase
      {} as never, // ChangeRoomModeUseCase
      {} as never, // EndRoomUseCase
      {} as never, // DeleteRoomUseCase
      {} as never, // AddHighlightUseCase
      {} as never, // RemoveHighlightUseCase
      {} as never, // GenerateHighlightInsightUseCase
      updateProgress as never,
      chapterRepository as never,
      redis as never,
    );
    gateway.server = {
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as never;

    warn = jest
      .spyOn(gateway['logger'], 'warn')
      .mockImplementation(() => undefined);

    socket = {
      data: {
        userId: 'user-1',
        role: 'user',
        displayName: 'User One',
        avatarUrl: '',
        roomId: 'room-1',
        bookId: 'book-1',
      },
      rooms: new Set(['room:room-1']),
      leave: jest.fn(),
    };
  });

  afterEach(() => {
    warn.mockRestore();
    jest.useRealTimers();
  });

  it('saves progress using the chapterId the client sent', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });

    await heartbeat();

    expect(chapterRepository.findById).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        bookId: 'book-1',
        chapterId: CHAPTER_ID,
        progress: 50,
        monotonic: true,
      }),
    );
  });

  it('verifies the chapter once and reuses the cache on later flushes', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });

    await heartbeat();
    await heartbeat();
    await heartbeat();

    expect(chapterRepository.findById).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledTimes(3);
  });

  it('re-verifies when the socket moves to a room holding another book', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });

    await heartbeat();
    expect(chapterRepository.findById).toHaveBeenCalledTimes(1);

    socket.data.bookId = 'book-2';
    await heartbeat();

    // Cache lưu chapterId → book-1, nên book-2 phải được xác minh lại
    expect(chapterRepository.findById).toHaveBeenCalledTimes(2);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('does not belong to book book-2'),
    );
  });

  it('does not cache a failed verification — the next flush retries', async () => {
    chapterRepository.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: { toString: () => CHAPTER_ID },
        bookId: { toString: () => 'book-1' },
      });

    await heartbeat();
    expect(chapterRepository.findById).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await heartbeat();
    expect(chapterRepository.findById).toHaveBeenCalledTimes(2);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
  });

  it('refuses a chapterId that belongs to another book', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => OTHER_BOOK_ID },
    });

    await heartbeat();

    expect(updateProgress.execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('does not belong to book book-1'),
    );
  });

  it('refuses a chapterId that does not exist', async () => {
    chapterRepository.findById.mockResolvedValue(null);

    await heartbeat();

    expect(updateProgress.execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('never queries the DB for a chapterId that is not a valid ObjectId', async () => {
    await heartbeat({ chapterId: 'chuong-1' });
    expect(chapterRepository.findById).not.toHaveBeenCalled();
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await heartbeat({ chapterId: undefined });
    expect(chapterRepository.findById).not.toHaveBeenCalled();
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await heartbeat({ chapterId: '__proto__' });
    expect(chapterRepository.findById).not.toHaveBeenCalled();
    expect(updateProgress.execute).not.toHaveBeenCalled();
  });

  it('still broadcasts presence when chapterId is unusable', async () => {
    await heartbeat({ chapterId: 'not-an-object-id' });

    expect(presenceService.upsertPresence).toHaveBeenCalledWith(
      'room-1',
      'user-1',
      expect.objectContaining({ currentChapterSlug: 'chuong-1' }),
    );
  });

  it('logs but does not throw when the progress write fails', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });
    updateProgress.execute.mockRejectedValue(new Error('write failed'));
    const error = jest
      .spyOn(gateway['logger'], 'error')
      .mockImplementation(() => undefined);

    await expect(
      gateway.handleHeartbeat(socket as never, socket.data as never, {
        roomId: 'room-1',
        chapterSlug: 'chuong-1',
        chapterId: CHAPTER_ID,
        progress: 50,
      }),
    ).resolves.toBeUndefined();

    await jest.advanceTimersByTimeAsync(10_000);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to save reading progress'),
    );

    error.mockRestore();
  });

  it('flushes pending progress when the user leaves the room', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });

    await gateway.handleHeartbeat(socket as never, socket.data, {
      roomId: 'room-1',
      chapterSlug: 'chuong-1',
      chapterId: CHAPTER_ID,
      progress: 55,
    });
    // Timer 10s chưa bắn → chưa lưu
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await gateway.handleLeaveRoom(socket as never, socket.data, {
      roomId: 'room-1',
    });

    // flush ngay khi rời phòng, không để mất tiến độ
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterId: CHAPTER_ID,
        progress: 55,
        monotonic: true,
      }),
    );

    // Timer đã được dọn — advance thêm cũng không lưu thêm lần nữa
    await jest.advanceTimersByTimeAsync(20_000);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(leaveRoom.execute).toHaveBeenCalledTimes(1);
  });

  it('flushes pending progress on disconnect', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });

    await gateway.handleHeartbeat(socket as never, socket.data, {
      roomId: 'room-1',
      chapterSlug: 'chuong-1',
      chapterId: CHAPTER_ID,
      progress: 70,
    });
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await gateway.handleDisconnect(socket as never);

    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({ chapterId: CHAPTER_ID, progress: 70 }),
    );
  });

  it('does not leave the old slug cache on socket data', async () => {
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => 'book-1' },
    });

    await heartbeat();

    expect(socket.data).not.toHaveProperty('chapterSlugToId');
    expect(socket.data.verifiedChapters).toBeInstanceOf(Map);
    expect(socket.data.verifiedChapters?.get(CHAPTER_ID)).toBe('book-1');
  });
});
