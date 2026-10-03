import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';

type SocketDataLike = {
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  roomId?: string;
  bookId?: string;
  chapterSlugToId?: Map<string, string | null>;
  pendingProgress?: unknown;
  progressTimer?: NodeJS.Timeout;
};

type FakeSocket = {
  data: SocketDataLike;
  rooms: Set<string>;
  leave: jest.Mock;
};

describe('ReadingRoomGateway progress slug cache (negative cache)', () => {
  let gateway: ReadingRoomGateway;
  let chapterRepository: { findBySlug: jest.Mock };
  let updateProgress: { execute: jest.Mock };
  let leaveRoom: { execute: jest.Mock };
  let presenceService: {
    upsertPresence: jest.Mock;
    getRoomPresences: jest.Mock;
    removePresence: jest.Mock;
  };
  let socket: FakeSocket;

  const heartbeat = async (chapterSlug: string): Promise<void> => {
    await gateway.handleHeartbeat(socket as never, socket.data as never, {
      roomId: 'room-1',
      chapterSlug,
      progress: 50,
    });
    // Chờ debounce 10s của progress timer
    await jest.advanceTimersByTimeAsync(10_000);
  };

  beforeEach(() => {
    jest.useFakeTimers();

    chapterRepository = { findBySlug: jest.fn() };
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

    socket = {
      data: {
        userId: 'user-1',
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
    jest.useRealTimers();
  });

  it('queries the DB only once for a slug that does not exist (negative cache)', async () => {
    chapterRepository.findBySlug.mockResolvedValue(null);

    await heartbeat('chuong-khong-ton-tai');
    await heartbeat('chuong-khong-ton-tai');
    await heartbeat('chuong-khong-ton-tai');

    expect(chapterRepository.findBySlug).toHaveBeenCalledTimes(1);
    // Không có chapterId → không được gọi lưu tiến độ
    expect(updateProgress.execute).not.toHaveBeenCalled();
  });

  it('still resolves a valid slug only once while saving progress on every flush', async () => {
    chapterRepository.findBySlug.mockResolvedValue({
      id: { toString: () => 'chapter-1' },
    });

    await heartbeat('chuong-1');
    await heartbeat('chuong-1');

    expect(chapterRepository.findBySlug).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledTimes(2);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        bookId: 'book-1',
        chapterId: 'chapter-1',
        progress: 50,
        monotonic: true,
      }),
    );
  });

  it('does not cache a transient DB error — the next flush must retry', async () => {
    chapterRepository.findBySlug
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce({ id: { toString: () => 'chapter-2' } });

    await heartbeat('chuong-2');
    // Lỗi DB: không lưu tiến độ, không cache
    expect(chapterRepository.findBySlug).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await heartbeat('chuong-2');
    expect(chapterRepository.findBySlug).toHaveBeenCalledTimes(2);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({ chapterId: 'chapter-2' }),
    );
  });

  it('treats the reserved key "__proto__" as a plain slug (Map, not object literal)', async () => {
    chapterRepository.findBySlug.mockResolvedValue(null);

    await heartbeat('__proto__');
    await heartbeat('__proto__');

    expect(chapterRepository.findBySlug).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).not.toHaveBeenCalled();

    const cache = socket.data.chapterSlugToId;
    expect(cache).toBeInstanceOf(Map);
    expect(cache?.size).toBe(1);
    expect(cache?.get('__proto__')).toBeNull();
    // Không ghi nhầm vào prototype của bất kỳ object nào
    expect(Object.getPrototypeOf(cache as object)).toBe(Map.prototype);
  });

  it('flushes pending progress when the user leaves the room', async () => {
    chapterRepository.findBySlug.mockResolvedValue({
      id: { toString: () => 'chapter-1' },
    });

    await gateway.handleHeartbeat(socket as never, socket.data as never, {
      roomId: 'room-1',
      chapterSlug: 'chuong-1',
      progress: 55,
    });
    // Timer 10s chưa bắn → chưa lưu
    expect(updateProgress.execute).not.toHaveBeenCalled();

    await gateway.handleLeaveRoom(socket as never, socket.data as never, {
      roomId: 'room-1',
    });

    // flush ngay khi rời phòng, không để mất tiến độ
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 55, monotonic: true }),
    );

    // Timer đã được dọn — advance thêm cũng không lưu thêm lần nữa
    await jest.advanceTimersByTimeAsync(20_000);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(leaveRoom.execute).toHaveBeenCalledTimes(1);
  });

  it('keeps per-slug lookups independent (bad slug does not poison a good one)', async () => {
    chapterRepository.findBySlug.mockImplementation((slug: string) =>
      Promise.resolve(
        slug === 'chuong-1' ? { id: { toString: () => 'chapter-1' } } : null,
      ),
    );

    await heartbeat('chuong-xo');
    await heartbeat('chuong-1');

    expect(chapterRepository.findBySlug).toHaveBeenCalledTimes(2);
    expect(updateProgress.execute).toHaveBeenCalledTimes(1);
    expect(updateProgress.execute).toHaveBeenCalledWith(
      expect.objectContaining({ chapterId: 'chapter-1' }),
    );
  });
});
