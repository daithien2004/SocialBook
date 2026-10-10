import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { WsException } from '@nestjs/websockets';
import { WsRoomGuard } from '@/modules/reading-rooms/presentation/websocket/core/ws-room.guard';

describe('WsRoomGuard', () => {
  const guard = new WsRoomGuard();
  const client = {
    data: { roomId: 'ROOM123' },
    rooms: new Set(['room:ROOM123']),
  };

  function contextWithPayload(payload: unknown): ExecutionContextHost {
    const context = new ExecutionContextHost([client, payload]);
    context.setType('ws');
    return context;
  }

  it('allows payloads naming the socket room', () => {
    expect(guard.canActivate(contextWithPayload({ roomId: 'ROOM123' }))).toBe(
      true,
    );
  });

  it.each([undefined, null, 'ROOM123', { roomId: 42 }, { roomId: 'OTHER1' }])(
    'rejects an invalid or mismatched room payload: %s',
    (payload) => {
      expect(() => guard.canActivate(contextWithPayload(payload))).toThrow(
        WsException,
      );
    },
  );
});
