import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';

type FakeSocket = {
  data: { userId: string; role: string; roomId?: string };
  rooms: Set<string>;
  emit: jest.Mock;
};

describe('ReadingRoomGateway remove_highlight room guard', () => {
  let gateway: ReadingRoomGateway;
  let removeHighlight: { execute: jest.Mock };

  const makeSocket = (joined: boolean): FakeSocket => ({
    data: { userId: 'user-1', role: 'user', roomId: 'room-1' },
    rooms: joined ? new Set(['room:room-1']) : new Set(),
    emit: jest.fn(),
  });

  beforeEach(() => {
    removeHighlight = { execute: jest.fn().mockResolvedValue({}) };

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
      {} as never, // AddHighlightUseCase
      removeHighlight as never,
      {} as never, // GenerateHighlightInsightUseCase
      {} as never, // UpdateProgressUseCase
      {} as never, // IChapterRepository
      {} as never, // Redis
    );
    gateway.server = {
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as never;
  });

  it('rejects remove_highlight when the socket has not joined the room', async () => {
    const socket = makeSocket(false);

    await gateway.handleRemoveHighlight(socket as never, 'user-1', {
      roomId: 'room-1',
      highlightId: 'h1',
    });

    expect(removeHighlight.execute).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'NOT_IN_ROOM' }),
    );
  });

  it('allows remove_highlight once the socket has joined the room', async () => {
    const socket = makeSocket(true);

    await gateway.handleRemoveHighlight(socket as never, 'user-1', {
      roomId: 'room-1',
      highlightId: 'h1',
    });

    expect(removeHighlight.execute).toHaveBeenCalledTimes(1);
    expect(socket.emit).not.toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'NOT_IN_ROOM' }),
    );
  });
});
