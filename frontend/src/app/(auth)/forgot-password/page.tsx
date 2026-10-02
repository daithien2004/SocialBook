import { Metadata } from 'next';
import { ForgotPasswordPageClient } from '@/features/auth/components/ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Quên mật khẩu | SocialBook',
  description: 'Khôi phục mật khẩu tài khoản SocialBook của bạn.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
