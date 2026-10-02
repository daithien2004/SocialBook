import { Metadata } from 'next';
import { VerifyOtpPageClient } from '@/features/auth/components/VerifyOtpPageClient';

export const metadata: Metadata = {
  title: 'Xác Minh OTP | SocialBook',
  description: 'Xác minh địa chỉ email của bạn bằng mã OTP.',
};

export default function VerifyOtpPageWrapper() {
  return <VerifyOtpPageClient />;
}
