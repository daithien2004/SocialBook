import { Metadata } from 'next';
import { LoginPageClient } from '@/features/auth/components/LoginPageClient';

export const metadata: Metadata = {
  title: 'Đăng Nhập | SocialBook',
  description: 'Đăng nhập vào SocialBook để tiếp tục đọc và chia sẻ sách.',
};

export default function LoginPageWrapper() {
  return <LoginPageClient />;
}
