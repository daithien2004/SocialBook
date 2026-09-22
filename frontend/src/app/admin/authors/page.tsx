import { Suspense } from 'react';
import AuthorsClientPage from './_components/AuthorsClientPage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Quản lý tác giả — SocialBook Admin',
  description: 'Quản lý danh sách tác giả trong hệ thống',
};

export default function AdminAuthorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <AuthorsClientPage />
    </Suspense>
  );
}
