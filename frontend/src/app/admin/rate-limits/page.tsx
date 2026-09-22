import { Suspense } from 'react';
import RateLimitsClientPage from './_components/RateLimitsClientPage';

export const metadata = {
  title: 'Rate Limits — SocialBook Admin',
  description: 'Cấu hình giới hạn yêu cầu API cho hệ thống',
};

export default function RateLimitsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <p className="text-gray-500">Đang tải cấu hình...</p>
        </div>
      }
    >
      <RateLimitsClientPage />
    </Suspense>
  );
}
