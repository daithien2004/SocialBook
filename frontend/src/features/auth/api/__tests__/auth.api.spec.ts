/** @jest-environment jsdom */
import {
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from '@/features/auth/api/auth.api';
import { apiRequest } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('auth api functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signup posts directly to the backend', async () => {
    mockedApiRequest.mockResolvedValue({
      message: 'Mã OTP đã được gửi đến email của bạn',
    });

    const payload = {
      username: 'u',
      email: 'a@b.co',
      password: 'password',
      confirmPassword: 'password',
    };

    await expect(signup(payload)).resolves.toEqual({
      message: 'Mã OTP đã được gửi đến email của bạn',
    });
    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/signup',
      method: 'POST',
      data: payload,
    });
  });

  it('verifyOtp posts directly to the backend', async () => {
    mockedApiRequest.mockResolvedValue({ message: 'Xác thực thành công' });

    await expect(
      verifyOtp({ email: 'a@b.co', otp: '123456' }),
    ).resolves.toEqual({ message: 'Xác thực thành công' });
    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/verify-otp',
      method: 'POST',
      data: { email: 'a@b.co', otp: '123456' },
    });
  });

  it('resendOtp returns the unwrapped cooldown value', async () => {
    mockedApiRequest.mockResolvedValue({ resendCooldown: 60 });

    await expect(resendOtp({ email: 'a@b.co' })).resolves.toEqual({
      resendCooldown: 60,
    });
    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/resend-otp',
      method: 'POST',
      data: { email: 'a@b.co' },
    });
  });

  it('forgotPassword posts directly to the backend', async () => {
    mockedApiRequest.mockResolvedValue({
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn',
    });

    await expect(forgotPassword({ email: 'a@b.co' })).resolves.toEqual({
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn',
    });
    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/forgot-password',
      method: 'POST',
      data: { email: 'a@b.co' },
    });
  });

  it('resetPassword posts directly to the backend', async () => {
    mockedApiRequest.mockResolvedValue({ message: 'Đổi mật khẩu thành công' });

    await expect(
      resetPassword({
        email: 'a@b.co',
        otp: '123456',
        newPassword: 'newpassword',
      }),
    ).resolves.toEqual({ message: 'Đổi mật khẩu thành công' });
    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/reset-password',
      method: 'POST',
      data: {
        email: 'a@b.co',
        otp: '123456',
        newPassword: 'newpassword',
      },
    });
  });

  it('login posts directly to the backend', async () => {
    mockedApiRequest.mockResolvedValue({ message: 'Đăng nhập thành công' });

    await expect(
      login({ email: 'a@b.co', password: 'password' }),
    ).resolves.toEqual({ message: 'Đăng nhập thành công' });
    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/login',
      method: 'POST',
      data: { email: 'a@b.co', password: 'password' },
    });
  });

  it('propagates the backend rejection', async () => {
    const rejection = {
      isAxiosError: true,
      response: { status: 401, data: { message: 'Sai email hoặc mật khẩu' } },
    };
    mockedApiRequest.mockRejectedValue(rejection);

    await expect(
      login({ email: 'a@b.co', password: 'wrong' }),
    ).rejects.toBe(rejection);
  });
});
