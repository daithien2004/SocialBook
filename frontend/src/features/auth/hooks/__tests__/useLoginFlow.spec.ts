import { renderHook, act } from '@testing-library/react';
import { useLoginFlow } from '../useLoginFlow';
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
      json: async () => ({}),
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
  });

  it('should surface backend error message on failed login', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Sai email hoặc mật khẩu' }),
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

  it('should navigate to /api/auth/google on google sign in', () => {
    const { result } = renderHook(() => useLoginFlow());

    act(() => {
      result.current.handleGoogleSignin();
    });

    expect(mockPush).toHaveBeenCalledWith('/api/auth/google');
  });

  it('should navigate to /api/auth/github on github sign in', () => {
    const { result } = renderHook(() => useLoginFlow());

    act(() => {
      result.current.handleGithubSignin();
    });

    expect(mockPush).toHaveBeenCalledWith('/api/auth/github');
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

  it('should redirect home when oauth=success is present', () => {
    mockGetParam.mockReturnValue('success');

    const { result } = renderHook(() => useLoginFlow());

    act(() => {
      result.current.handleOAuthSuccess();
    });

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});