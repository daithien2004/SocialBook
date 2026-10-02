import { RedisIoAdapter } from '@/presentation/gateways/redis-io.adapter';
import { instrument } from '@socket.io/admin-ui';

jest.mock('@socket.io/admin-ui', () => ({
  instrument: jest.fn(),
}));

describe('RedisIoAdapter (T1: Admin UI Auth)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SOCKET_ADMIN_UI;
    delete process.env.SOCKET_ADMIN_USER;
    delete process.env.SOCKET_ADMIN_PASSWORD_BCRYPT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does NOT initialize Admin UI when SOCKET_ADMIN_UI is unset', () => {
    const adapter = new RedisIoAdapter();
    const mockServer = { adapter: jest.fn() };
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(adapter)), 'createIOServer').mockReturnValue(mockServer);

    adapter.createIOServer(5000);

    expect(instrument).not.toHaveBeenCalled();
  });

  it('does NOT initialize Admin UI when credentials are missing even if SOCKET_ADMIN_UI=true', () => {
    process.env.SOCKET_ADMIN_UI = 'true';
    const adapter = new RedisIoAdapter();
    const mockServer = { adapter: jest.fn() };
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(adapter)), 'createIOServer').mockReturnValue(mockServer);

    adapter.createIOServer(5000);

    expect(instrument).not.toHaveBeenCalled();
  });

  it('initializes Admin UI with basic auth and readonly=true when enabled with credentials', () => {
    process.env.SOCKET_ADMIN_UI = 'true';
    process.env.SOCKET_ADMIN_USER = 'admin';
    process.env.SOCKET_ADMIN_PASSWORD_BCRYPT = '$2b$10$hashedpasswordvalue12345';
    process.env.NODE_ENV = 'production';

    const adapter = new RedisIoAdapter();
    const mockServer = { adapter: jest.fn() };
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(adapter)), 'createIOServer').mockReturnValue(mockServer);

    adapter.createIOServer(5000);

    expect(instrument).toHaveBeenCalledWith(
      mockServer,
      expect.objectContaining({
        auth: {
          type: 'basic',
          username: 'admin',
          password: '$2b$10$hashedpasswordvalue12345',
        },
        mode: 'production',
        readonly: true,
      }),
    );
  });
});
