import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('ReadingRoomGateway Authentication & Origin Check (T6)', () => {
  let gateway: ReadingRoomGateway;
  let mockJwtService: { verifyAsync: jest.Mock };
  let mockConfigService: { get: jest.Mock };
  let mockRedis: { get: jest.Mock; set: jest.Mock };
  let mockServer: { use: jest.Mock; in: jest.Mock };
  let middlewareFn: (socket: unknown, next: (err?: Error) => void) => void;

  beforeEach(() => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, def?: unknown) => {
        if (key === 'env.FRONTEND_URL') return 'http://localhost:3000,https://socialbook.io.vn';
        return def;
      }),
    };
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };
    mockServer = {
      use: jest.fn((fn) => {
        middlewareFn = fn;
      }),
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([]),
        disconnectSockets: jest.fn(),
      }),
    };

    gateway = new ReadingRoomGateway(
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      mockRedis as never,
    );

    gateway.afterInit(mockServer as never);
  });

  it('rejects connection when cookie auth is used with untrusted/foreign Origin (CSWSH prevention)', async () => {
    const socket = {
      handshake: {
        auth: {},
        headers: {
          cookie: 'sb_access_token=valid-cookie-token',
          origin: 'https://evil-attacker.com',
        },
      },
      data: {},
    };

    const next = jest.fn();
    await middlewareFn(socket, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'forbidden_origin' }));
    expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('allows connection when cookie auth is used with allowed Origin', async () => {
    const socket = {
      handshake: {
        auth: {},
        headers: {
          cookie: 'sb_access_token=valid-cookie-token',
          origin: 'https://socialbook.io.vn',
        },
      },
      data: {},
    };

    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-123',
      role: 'user',
      displayName: 'Test User',
      iat: Math.floor(Date.now() / 1000),
    });

    const runMiddleware = (s: unknown) =>
      new Promise<Error | undefined>((resolve) => {
        middlewareFn(s, (err) => resolve(err));
      });

    const err = await runMiddleware(socket);
    expect(err).toBeUndefined();
    expect(socket.data.userId).toBe('user-123');
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
      'valid-cookie-token',
      expect.objectContaining({ algorithms: ['HS256'] }),
    );
  });

  it('rejects connection when token has been revoked in Redis', async () => {
    const tokenIat = 1700000000;
    const socket = {
      handshake: {
        auth: { token: 'explicit-token' },
        headers: {},
      },
      data: {},
    };

    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-revoked',
      role: 'user',
      iat: tokenIat,
    });

    // Revocation recorded after token was issued
    mockRedis.get.mockResolvedValue(String((tokenIat + 100) * 1000));

    const runMiddleware = (s: unknown) =>
      new Promise<Error | undefined>((resolve) => {
        middlewareFn(s, (err) => resolve(err));
      });

    const err = await runMiddleware(socket);
    expect(err).toEqual(expect.objectContaining({ message: 'token_revoked' }));
  });
});
