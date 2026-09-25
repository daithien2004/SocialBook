/** @jest-environment jsdom */
import { refreshAuthSession } from '@/lib/auth-refresh';

jest.mock('@/env', () => ({
  env: { NEXT_PUBLIC_NEST_API_URL: 'http://localhost:5000/api' },
}));

const REFRESH_URL = 'http://localhost:5000/api/auth/refresh';

function jsonResponse(status: number): Response {
  return {
    ok: status < 400,
    status,
    json: async () => ({ message: 'ok' }),
    text: async () => JSON.stringify({ message: 'ok' }),
  } as unknown as Response;
}

describe('refreshAuthSession', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    document.cookie = 'sb_csrf_token=csrf-abc';
  });

  afterEach(() => {
    document.cookie = 'sb_csrf_token=; Max-Age=0';
  });

  it('posts directly to the backend with csrf header and returns true on success', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200));

    await expect(refreshAuthSession()).resolves.toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(REFRESH_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'csrf-abc',
      },
      body: '{}',
    });
  });

  it('returns false when the refresh endpoint rejects', async () => {
    mockFetch.mockResolvedValue(jsonResponse(401));

    await expect(refreshAuthSession()).resolves.toBe(false);
  });

  it('returns false on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));

    await expect(refreshAuthSession()).resolves.toBe(false);
  });

  it('omits the csrf header when the cookie is absent', async () => {
    document.cookie = 'sb_csrf_token=; Max-Age=0';
    mockFetch.mockResolvedValue(jsonResponse(200));

    await refreshAuthSession();

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('does not read tokens from the response body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Làm mới token thành công' }),
    } as unknown as Response);

    await expect(refreshAuthSession()).resolves.toBe(true);
  });

  it('deduplicates concurrent calls into a single refresh request', async () => {
    let resolveRefresh: ((value: Response) => void) | undefined;
    mockFetch.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const first = refreshAuthSession();
    const second = refreshAuthSession();
    const third = refreshAuthSession();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    resolveRefresh?.(jsonResponse(200));

    await expect(Promise.all([first, second, third])).resolves.toEqual([
      true,
      true,
      true,
    ]);
  });

  it('allows a new refresh after the previous one settles', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200));

    await refreshAuthSession();
    await refreshAuthSession();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
