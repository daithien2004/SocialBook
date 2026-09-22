import { renderHook, act } from '@testing-library/react';
import { useLoginFlow } from '../useLoginFlow';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { waitForSessionRole } from '@/lib/session';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  waitForSessionRole: jest.fn(),
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

  beforeEach(() => {
    mockPush = jest.fn();
    mockReplace = jest.fn();
    mockGetParam = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGetParam,
    });
    
    jest.clearAllMocks();
  });

  it('should handle successful login and redirect user based on role', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });
    (waitForSessionRole as jest.Mock).mockResolvedValue({ user: { role: 'user' } });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({ email: 'test@test.com', password: 'password' });
    });

    expect(signIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@test.com',
      password: 'password',
    });
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful login and redirect admin to /admin', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });
    (waitForSessionRole as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({ email: 'admin@test.com', password: 'password' });
    });

    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('should handle failed login', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit({ email: 'test@test.com', password: 'password' });
    });

    expect(result.current.serverError).toBe('Invalid credentials');
    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle google sign in', () => {
    const { result } = renderHook(() => useLoginFlow());

    act(() => {
      result.current.handleGoogleSignin();
    });

    expect(signIn).toHaveBeenCalledWith('google', { redirect: true, callbackUrl: '/' });
  });

  it('should handle error from search params', () => {
    mockGetParam.mockReturnValue('OAuthCallback');

    const { result } = renderHook(() => useLoginFlow());

    act(() => {
      result.current.handleErrorFromParams();
    });

    expect(result.current.serverError).toBe('Sign in failed. Please try again.');
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
