import { renderHook, act } from '@testing-library/react';
import {
  GITHUB_OAUTH_URL,
  GOOGLE_OAUTH_URL,
  useLoginFlow,
} from '../useLoginFlow';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSession } from '@/lib/app-session';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/app-session', () => ({
  useAppSession: jest.fn(),
}));

jest.mock('@/lib/query-client', () => ({
  queryClient: {
    clear: jest.fn(),
  },
}));

describe('useLoginFlow', () => {
  let mockPush: jest.Mock;
  let mockReplace: jest.Mock;
  let mockGetParam: jest.Mock;
  let mockRefetch: jest.Mock;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    mockReplace = jest.fn();
    mockGetParam = jest.fn();
    mockRefetch = jest.fn().mockResolvedValue(undefined);

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGetParam,
    });

    (useAppSession as jest.Mock).mockReturnValue({ refetch: mockRefetch });

    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;

    jest.clearAllMocks();
  });

  it('should login via same-origin proxy and redirect home', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@test.com',
        password: 'password',
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.serverError).toBeNull();
  });

  it('should unwrap nested data envelope from proxy response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { id: 'u1' } }),
    });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@test.com',
        password: 'password',
      });
    });

    expect(result.current.serverError).toBeNull();
  });

  it('should surface backend error message on failed login', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Sai email hoặc mật khẩu' }),
    });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@test.com',
        password: 'wrong',
      });
    });

    expect(result.current.serverError).toBe('Sai email hoặc mật khẩu');
    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should navigate to the google oauth proxy endpoint', () => {
    expect(GOOGLE_OAUTH_URL).toBe('/api/auth/google?callbackUrl=/');
  });

  it('should navigate to the github oauth proxy endpoint', () => {
    expect(GITHUB_OAUTH_URL).toBe('/api/auth/github?callbackUrl=/');
  });

  it('should map OAuth error codes from search params', () => {
    mockGetParam.mockReturnValue('EmailNotVerified');

    const { result } = renderHook(() => useLoginFlow());

    act(() => {
      result.current.handleErrorFromParams();
    });

    expect(result.current.serverError).toBe(
      'Email chưa được xác thực bởi nhà cung cấp.',
    );
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('should redirect home when oauth=success is present', async () => {
    mockGetParam.mockReturnValue('success');

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleOAuthSuccess();
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
