import { Metadata } from 'next';
import { SignupPageClient } from '@/features/auth/components/SignupPageClient';

export const metadata: Metadata = {
  title: 'Đăng Ký | SocialBook',
  description: 'Tạo tài khoản mới trên SocialBook.',
};

export default function SignupPage() {
  return <SignupPageClient />;
}
