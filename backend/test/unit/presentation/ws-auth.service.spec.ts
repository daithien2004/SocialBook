import Redis from 'ioredis';
import { Socket } from 'socket.io';
import { AuthException } from '@/shared/domain/common-exceptions';
import { WsAuthService } from '@/modules/reading-rooms/presentation/websocket/core/ws-auth.service';
import { fakeOf } from '../../support/typed-fake';

const makeRedis = (ticketPayload: string) => {
  const transaction = {
    zremrangebyscore: jest.fn().mockReturnThis(),
    zadd: jest.fn().mockReturnThis(),
    zcard: jest.fn().mockReturnThis(),
    pexpire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      [null, 0],
      [null, 1],
      [null, 1],
      [null, 1],
    ]),
  };
  const redis = fakeOf<Redis>({
    getdel: jest.fn().mockResolvedValue(ticketPayload),
    multi: () => fakeOf<ReturnType<Redis['multi']>>(transaction),
  });

  return { redis, transaction };
};

const makeSocket = (): Socket =>
  fakeOf<Socket>({
    id: 'socket-1',
    handshake: { auth: { ticket: 'one-time-ticket' } },
  });

describe('WsAuthService', () => {
  it('accepts a verified ticket with a non-empty display name', async () => {
    const { redis } = makeRedis(
      JSON.stringify({ userId: 'user-1', displayName: 'Reader' }),
    );
    const service = new WsAuthService(redis);

    await expect(service.authenticate(makeSocket())).resolves.toMatchObject({
      userId: 'user-1',
      displayName: 'Reader',
    });
  });

  it('rejects an authenticated ticket that has no display name', async () => {
    const { redis, transaction } = makeRedis(
      JSON.stringify({ userId: 'user-1' }),
    );
    const service = new WsAuthService(redis);

    await expect(service.authenticate(makeSocket())).rejects.toBeInstanceOf(
      AuthException,
    );
    expect(transaction.exec).not.toHaveBeenCalled();
  });

  it('rejects an authenticated ticket with a blank display name', async () => {
    const { redis } = makeRedis(
      JSON.stringify({ userId: 'user-1', displayName: '   ' }),
    );
    const service = new WsAuthService(redis);

    await expect(service.authenticate(makeSocket())).rejects.toBeInstanceOf(
      AuthException,
    );
  });
});
