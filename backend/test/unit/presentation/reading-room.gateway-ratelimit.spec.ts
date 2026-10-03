import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';
import type { SocketData } from '@/presentation/gateways/reading-room.types';

type FakeSocket = {
  data: SocketData;
  rooms: Set<string>;
  emit: jest.Mock;
};

describe('ReadingRoomGateway WS rate limiting', () => {
  let gateway: ReadingRoomGateway;
  let addHighlight: { execute: jest.Mock };
  let redis: { multi: jest.Mock };
  /** Giá trị "số lần hiện tại" mà Redis giả trả về cho handler */
  let redisCurrent: number;

  const makeSocket = (data: Partial<SocketData> = {}): FakeSocket => ({
    data: {
      userId: 'user-1',
      role: 'user',
      displayName: 'User One',
      avatarUrl: '',
      roomId: 'room-1',
      bookId: 'book-1',
      ...data,
    },
    rooms: new Set(['room:room-1']),
    emit: jest.fn(),
  });

  const body = {
    roomId: 'room-1',
    chapterSlug: 'chuong-1',
    paragraphId: 'p1',
    content: 'đoạn văn highlight',
  };

  beforeEach(() => {
    redisCurrent = 1;
    redis = {
      multi: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(() =>
          Promise.resolve([
            [null, 'OK'],
            [null, redisCurrent],
          ]),
        ),
      })),
    };
    addHighlight = {
      execute: jest.fn().mockResolvedValue({
        highlights: [
          {
            id: 'h1',
            userId: 'user-1',
            displayName: 'User One',
            avatarUrl: '',
            chapterSlug: 'chuong-1',
            paragraphId: 'p1',
            content: 'đoạn văn highlight',
            createdAt: new Date(),
          },
        ],
      }),
    };

    gateway = new ReadingRoomGateway(
      {} as never, // JwtService
      {} as never, // ConfigService
      {} as never, // ReadingRoomPresenceService
      {} as never, // JoinRoomUseCase
      {} as never, // LeaveRoomUseCase
      {} as never, // ChangeChapterUseCase
      {} as never, // ChangeRoomModeUseCase
      {} as never, // EndRoomUseCase
      {} as never, // DeleteRoomUseCase
      addHighlight as never,
      {} as never, // RemoveHighlightUseCase
      {} as never, // GenerateHighlightInsightUseCase
      {} as never, // UpdateProgressUseCase
      {} as never, // IChapterRepository
      redis as never,
    );
    gateway.server = {
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as never;
  });

  it('rejects add_highlight once the per-minute budget is exceeded', async () => {
    redisCurrent = 31; // limit add_highlight = 30/phút
    const socket = makeSocket();

    await gateway.handleAddHighlight(socket as never, socket.data, body);

    expect(addHighlight.execute).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });

  it('does not bypass the rate limit when userId is empty', async () => {
    // Trước khi sửa: if (!userId) return false → bỏ qua rate limit hoàn toàn
    redisCurrent = 31;
    const socket = makeSocket({ userId: '' });

    await gateway.handleAddHighlight(socket as never, socket.data, body);

    expect(redis.multi).toHaveBeenCalled();
    expect(addHighlight.execute).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });

  it('still allows requests at exactly the limit (current <= max)', async () => {
    redisCurrent = 30; // bằng hạn mức → chưa bị chặn (chặn khi current > max)
    const socket = makeSocket();

    await gateway.handleAddHighlight(socket as never, socket.data, body);

    expect(addHighlight.execute).toHaveBeenCalledTimes(1);
    expect(socket.emit).not.toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });
});
