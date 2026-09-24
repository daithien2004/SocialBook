export function mapOAuthError(error: string | null): string | null {
  switch (error) {
    case 'EmailUsedWithPassword':
      return 'Email đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.';
    case 'AccountBanned':
      return 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
    case 'EmailNotVerified':
      return 'Email chưa được xác thực bởi nhà cung cấp.';
    case 'SessionExpired':
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
    case 'OAuthFailed':
    default:
      return 'Đăng nhập bằng hệ thống bên ngoài thất bại. Vui lòng thử lại.';
  }
}