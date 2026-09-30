import { renderHook, act } from '@testing-library/react';
import { useLogin } from '../useLogin';
import { useRouter } from 'next/navigation';
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

describe('useLogin', () => {
  let mockPush: jest.Mock;
  let mockRefetch: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    mockRefetch = jest.fn().mockResolvedValue(undefined);

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useAppSession as jest.Mock).mockReturnValue({ refetch: mockRefetch });

    mockedLogin.mockReset();

    jest.clearAllMocks();
  });

  it('should login against the backend directly and redirect home', async () => {
    mockedLogin.mockResolvedValue({ message: 'Đăng nhập thành công' } as never);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({
        email: 'test@test.com',
        password: 'password',
      });
    });

    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    });
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(result.current.serverError).toBeNull();
  });

  it('should surface backend error message on failed login', async () => {
    mockedLogin.mockRejectedValue(axiosError('Sai email hoặc mật khẩu'));

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({
        email: 'test@test.com',
        password: 'wrong',
      });
    });

    expect(result.current.serverError).toBe('Sai email hoặc mật khẩu');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should join multiple validation messages from the backend', async () => {
    mockedLogin.mockRejectedValue(
      axiosError(['Email không hợp lệ', 'Mật khẩu quá ngắn']),
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({
        email: 'test@test.com',
        password: 'pw',
      });
    });

    expect(result.current.serverError).toBe(
      'Email không hợp lệ, Mật khẩu quá ngắn',
    );
  });
});
