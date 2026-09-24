import { mapOAuthError } from '@/lib/map-oauth-error';

describe('mapOAuthError', () => {
  it.each([
    ['EmailUsedWithPassword', 'Email đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.'],
    ['AccountBanned', 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'],
    ['EmailNotVerified', 'Email chưa được xác thực bởi nhà cung cấp.'],
    ['SessionExpired', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'],
  ])('maps %s to a Vietnamese message', (code, expected) => {
    expect(mapOAuthError(code)).toBe(expected);
  });

  it('defaults OAuthFailed and unknown codes to the generic message', () => {
    expect(mapOAuthError('OAuthFailed')).toBe(
      'Đăng nhập bằng hệ thống bên ngoài thất bại. Vui lòng thử lại.',
    );
    expect(mapOAuthError('SomethingUnexpected')).toBe(
      'Đăng nhập bằng hệ thống bên ngoài thất bại. Vui lòng thử lại.',
    );
  });

  it('returns the generic message for null', () => {
    expect(mapOAuthError(null)).toBe(
      'Đăng nhập bằng hệ thống bên ngoài thất bại. Vui lòng thử lại.',
    );
  });
});