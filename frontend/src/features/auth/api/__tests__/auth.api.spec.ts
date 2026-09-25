/** @jest-environment jsdom */
import {
  bffAuthPost,
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from '@/features/auth/api/auth.api';

describe('bffAuthPost', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    document.cookie = 'sb_csrf_token=csrf-123';
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.cookie = 'sb_csrf_token=; Max-Age=0';
  });

  it('posts to the same-origin proxy with credentials and csrf header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { id: 'u1' } }),
    });

    await bffAuthPost('/login', { email: 'a@b.co' });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'csrf-123',
      },
      body: JSON.stringify({ email: 'a@b.co' }),
    });
  });

  it('unwraps the data envelope', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { id: 'u1', email: 'a@b.co' } }),
    });

    await expect(bffAuthPost('/login', {})).resolves.toEqual({
      id: 'u1',
      email: 'a@b.co',
    });
  });

  it('returns undefined for empty bodies', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    await expect(bffAuthPost('/logout', {})).resolves.toBeUndefined();
  });

  it('throws an error carrying backend message on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({ message: ['Email không hợp lệ', 'Mật khẩu quá ngắn'] }),
    });

    await expect(bffAuthPost('/signup', {})).rejects.toMatchObject({
      status: 400,
      message: 'Email không hợp lệ,Mật khẩu quá ngắn',
    });
  });

  it('omits csrf header when cookie is absent', async () => {
    document.cookie = 'sb_csrf_token=; Max-Age=0';
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });

    await bffAuthPost('/login', {});

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });
});

describe('auth api functions', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    jest.clearAllMocks();
  });

  it('signup routes through the proxy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ data: { message: 'Đăng ký thành công' } }),
    });

    await expect(
      signup({
        username: 'u',
        email: 'a@b.co',
        password: 'password',
        confirmPassword: 'password',
      }),
    ).resolves.toEqual({ message: 'Đăng ký thành công' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/signup');
  });

  it('verifyOtp routes through the proxy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { message: 'Xác thực thành công' } }),
    });

    await expect(verifyOtp({ email: 'a@b.co', otp: '123456' })).resolves.toEqual({
      message: 'Xác thực thành công',
    });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/verify-otp');
  });

  it('resendOtp returns cooldown value', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { resendCooldown: 60 } }),
    });

    await expect(resendOtp({ email: 'a@b.co' })).resolves.toEqual({
      resendCooldown: 60,
    });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/resend-otp');
  });

  it('forgotPassword routes through the proxy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { message: 'Đã gửi email' } }),
    });

    await expect(forgotPassword({ email: 'a@b.co' })).resolves.toEqual({
      message: 'Đã gửi email',
    });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/forgot-password');
  });

  it('resetPassword routes through the proxy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { message: 'Đổi mật khẩu thành công' } }),
    });

    await expect(
      resetPassword({
        email: 'a@b.co',
        otp: '123456',
        newPassword: 'newpassword',
      }),
    ).resolves.toEqual({ message: 'Đổi mật khẩu thành công' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/reset-password');
  });

  it('login routes through the proxy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { message: 'Đăng nhập thành công' } }),
    });

    await expect(login({ email: 'a@b.co', password: 'password' })).resolves.toEqual(
      { message: 'Đăng nhập thành công' },
    );
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/login');
  });
});
