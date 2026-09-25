/** @jest-environment jsdom */
import clientApi, {
  apiRequest,
  type ApiRequestConfig,
} from '@/lib/api-client';
import { refreshAuthSession } from '@/lib/auth-refresh';
import { toast } from 'sonner';

jest.mock('@/env', () => ({
  env: { NEXT_PUBLIC_NEST_API_URL: 'http://localhost:5000/api' },
}));

jest.mock('@/lib/auth-refresh', () => ({
  refreshAuthSession: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

const mockedRefresh = refreshAuthSession as jest.MockedFunction<
  typeof refreshAuthSession
>;
const mockedToast = toast.error as jest.Mock;
const adapter = jest.fn();

interface FakeConfig {
  headers: Record<string, string>;
  data?: unknown;
  _retry?: boolean;
  skipAuthRedirect?: boolean;
  [key: string]: unknown;
}

type Handler = {
  fulfilled: (...args: unknown[]) => unknown;
  rejected: (...args: unknown[]) => unknown;
};

function handlersOf(kind: 'request' | 'response'): Handler {
  const manager = clientApi.interceptors[kind] as unknown as {
    handlers: Handler[];
  };
  return manager.handlers[0];
}

function requestHandler(config: FakeConfig): FakeConfig {
  return handlersOf('request').fulfilled(config) as FakeConfig;
}

function responseOnFulfilled(value: unknown): unknown {
  return handlersOf('response').fulfilled(value);
}

function responseOnRejected(error: unknown): Promise<unknown> {
  return handlersOf('response').rejected(error) as Promise<unknown>;
}

function okResponse(data: unknown, config: unknown = {}) {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function makeAxiosError(
  config: FakeConfig,
  status = 401,
  data: Record<string, unknown> = {},
) {
  const error = new Error(
    `Request failed with status code ${status}`,
  ) as Error & { isAxiosError: boolean; config: FakeConfig; response: unknown };
  error.isAxiosError = true;
  error.config = config;
  error.response = { status, data, statusText: 'Error', headers: {}, config };
  return error;
}

describe('clientApi configuration', () => {
  it('targets the backend with credentials enabled', () => {
    expect(clientApi.defaults.baseURL).toBe('http://localhost:5000/api');
    expect(clientApi.defaults.withCredentials).toBe(true);
  });
});

describe('request interceptor', () => {
  beforeEach(() => {
    clientApi.defaults.adapter = adapter;
  });

  afterEach(() => {
    document.cookie = 'sb_csrf_token=; Max-Age=0';
  });

  it('sets the csrf header from the cookie', () => {
    document.cookie = 'sb_csrf_token=csrf-abc';

    const config = requestHandler({ headers: {} });

    expect(config.headers['x-csrf-token']).toBe('csrf-abc');
    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('omits the csrf header when the cookie is absent', () => {
    const config = requestHandler({ headers: {} });

    expect(config.headers['x-csrf-token']).toBeUndefined();
  });

  it('leaves multipart uploads alone', () => {
    document.cookie = 'sb_csrf_token=csrf-abc';

    const config = requestHandler({ headers: {}, data: new FormData() });

    expect(config.headers['Content-Type']).toBeUndefined();
    expect(config.headers['x-csrf-token']).toBe('csrf-abc');
  });
});

describe('response interceptor', () => {
  beforeEach(() => {
    clientApi.defaults.adapter = adapter;
    adapter.mockReset();
    mockedRefresh.mockReset();
    mockedToast.mockReset();
  });

  it('passes successful responses through untouched', () => {
    const response = okResponse({ message: 'ok' });
    expect(responseOnFulfilled(response)).toBe(response);
  });

  it('refreshes and replays the request once after a 401', async () => {
    mockedRefresh.mockResolvedValue(true);
    adapter.mockImplementation((config) =>
      Promise.resolve(okResponse({ message: 'ok' }, config)),
    );
    const error = makeAxiosError({ headers: {} });

    const result = await responseOnRejected(error);

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expect(error.config._retry).toBe(true);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: 200 });
  });

  it('does not refresh twice for the same request', async () => {
    mockedRefresh.mockResolvedValue(true);
    const error = makeAxiosError({ headers: {}, _retry: true });

    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(mockedRefresh).not.toHaveBeenCalled();
  });

  it('rejects with the original error when the refresh fails', async () => {
    mockedRefresh.mockResolvedValue(false);
    const error = makeAxiosError({ headers: {} });

    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('keeps the current location when the caller opted out of redirecting', async () => {
    mockedRefresh.mockResolvedValue(false);
    const error = makeAxiosError({ headers: {}, skipAuthRedirect: true });
    const before = window.location.href;

    await expect(responseOnRejected(error)).rejects.toBe(error);

    expect(window.location.href).toBe(before);
  });

  it('shows a toast when the account is banned', async () => {
    const error = makeAxiosError({ headers: {} }, 403, {
      error: 'USER_BANNED',
      message: 'Đã bị cấm',
    });

    await expect(responseOnRejected(error)).rejects.toBe(error);

    expect(mockedToast).toHaveBeenCalledWith(
      'Tài khoản đã bị cấm',
      expect.objectContaining({ id: 'user-banned' }),
    );
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    clientApi.defaults.adapter = adapter;
    adapter.mockReset();
    adapter.mockImplementation((config) =>
      Promise.resolve(okResponse({ message: 'ok' }, config)),
    );
  });

  it('unwraps a plain data envelope', async () => {
    adapter.mockImplementation((config) =>
      Promise.resolve(okResponse({ data: { id: 'u1' } }, config)),
    );

    await expect(apiRequest({ url: '/auth/me' })).resolves.toEqual({
      id: 'u1',
    });
  });

  it('keeps pagination metadata intact', async () => {
    const payload = { data: [{ id: 'p1' }], meta: { total: 1 } };
    adapter.mockImplementation((config) =>
      Promise.resolve(okResponse(payload, config)),
    );

    await expect(apiRequest({ url: '/posts' })).resolves.toEqual(payload);
  });

  it('returns a message-only body unchanged', async () => {
    adapter.mockImplementation((config) =>
      Promise.resolve(
        okResponse({ message: 'Đăng nhập thành công' }, config),
      ),
    );

    await expect(apiRequest({ url: '/auth/login' })).resolves.toEqual({
      message: 'Đăng nhập thành công',
    });
  });

  it('forwards custom config fields to the request', async () => {
    adapter.mockImplementation((config) =>
      Promise.resolve(okResponse({ id: 'u1' }, config)),
    );
    const config: ApiRequestConfig = {
      url: '/auth/me',
      method: 'GET',
      skipAuthRedirect: true,
    };

    await apiRequest(config);

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      url: '/auth/me',
      method: 'get',
      skipAuthRedirect: true,
    });
  });
});
