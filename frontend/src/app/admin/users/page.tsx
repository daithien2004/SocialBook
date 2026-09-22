import { Suspense } from 'react';
import UsersClientPage from './_components/UsersClientPage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Quản lý người dùng — SocialBook Admin',
  description: 'Quản lý tài khoản người dùng trong hệ thống',
};

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <UsersClientPage />
    </Suspense>
  );
}
