import { renderHook, act } from '@testing-library/react';
import {
  GITHUB_OAUTH_URL,
  GOOGLE_OAUTH_URL,
  useLoginFlow,
} from '../useLoginFlow';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSession } from '@/lib/app-session';
import { login } from '@/features/auth/api/auth.api';

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

jest.mock('@/features/auth/api/auth.api', () => ({
  login: jest.fn(),
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;

function axiosError(message: string | string[]): unknown {
  return {
    isAxiosError: true,
    message: 'Request failed with status code 401',
    response: { status: 401, data: { message } },
  };
}

describe('useLoginFlow', () => {
  let mockPush: jest.Mock;
  let mockReplace: jest.Mock;
  let mockGetParam: jest.Mock;
  let mockRefetch: jest.Mock;

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

    mockedLogin.mockReset();

    jest.clearAllMocks();
  });

  it('should login against the backend directly and redirect home', async () => {
    mockedLogin.mockResolvedValue({ message: 'Đăng nhập thành công' });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@test.com',
        password: 'password',
      });
    });

    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    });
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.serverError).toBeNull();
  });

  it('should surface backend error message on failed login', async () => {
    mockedLogin.mockRejectedValue(axiosError('Sai email hoặc mật khẩu'));

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

  it('should join multiple validation messages from the backend', async () => {
    mockedLogin.mockRejectedValue(
      axiosError(['Email không hợp lệ', 'Mật khẩu quá ngắn']),
    );

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@test.com',
        password: 'pw',
      });
    });

    expect(result.current.serverError).toBe(
      'Email không hợp lệ, Mật khẩu quá ngắn',
    );
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
});
