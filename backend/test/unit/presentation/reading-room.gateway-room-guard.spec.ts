import { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsRoomGuard } from '@/presentation/gateways/ws-room.guard';
import type { RoomSocket } from '@/presentation/gateways/reading-room.types';
import { fakeOf } from '../../support/typed-fake';

/**
 * Guard `@UseGuards(WsRoomGuard)` giờ là nơi duy nhất chặn event khi socket
 * chưa vào phòng (refactor CQRS tách guard ra khỏi handler).
 */
const makeContext = (client: unknown, data: unknown): ExecutionContext =>
  fakeOf<ExecutionContext>({
    switchToWs: () => ({
      getClient: () => client,
      getData: () => data,
    }),
  });

describe('WsRoomGuard — remove_highlight room guard', () => {
  const guard = new WsRoomGuard();

  const makeSocket = (joined: boolean): Partial<RoomSocket> => ({
    id: 'socket-1',
    data: { userId: 'user-1', role: 'user', roomId: 'room-1' },
    rooms: joined ? new Set(['room:room-1']) : new Set<string>(),
  });

  it('rejects remove_highlight when the socket has not joined the room', () => {
    const socket = fakeOf<RoomSocket>(makeSocket(false));

    expect(() =>
      guard.canActivate(makeContext(socket, { roomId: 'room-1' })),
    ).toThrow(WsException);
  });

  it('rejects when the payload roomId differs from the socket roomId', () => {
    const socket = fakeOf<RoomSocket>(makeSocket(true));

    expect(() =>
      guard.canActivate(makeContext(socket, { roomId: 'room-2' })),
    ).toThrow(WsException);
  });

  it('rejects when the payload has no roomId', () => {
    const socket = fakeOf<RoomSocket>(makeSocket(true));

    expect(() => guard.canActivate(makeContext(socket, undefined))).toThrow(
      WsException,
    );
  });

  it('allows remove_highlight once the socket has joined the room', () => {
    const socket = fakeOf<RoomSocket>(makeSocket(true));

    expect(guard.canActivate(makeContext(socket, { roomId: 'room-1' }))).toBe(
      true,
    );
  });

  it('throws WsException carrying the NOT_IN_ROOM code', () => {
    const socket = fakeOf<RoomSocket>(makeSocket(false));

    try {
      guard.canActivate(makeContext(socket, { roomId: 'room-1' }));
      throw new Error('mong đợi guard ném WsException');
    } catch (err) {
      expect(err).toBeInstanceOf(WsException);
      if (!(err instanceof WsException)) throw err;
      expect(err.getError()).toEqual({ code: 'NOT_IN_ROOM' });
    }
  });
});
