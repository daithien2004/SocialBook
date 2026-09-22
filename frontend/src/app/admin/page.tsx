import { Suspense } from 'react';
import AdminDashboardClientPage from './_components/AdminDashboardClientPage';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const metadata = {
  title: 'Bảng điều khiển — SocialBook Admin',
  description: 'Tổng quan hệ thống SocialBook Admin',
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      }
    >
      <AdminDashboardClientPage />
    </Suspense>
  );
}