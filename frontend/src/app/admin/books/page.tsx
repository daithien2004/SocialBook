import { Suspense } from 'react';
import BooksClientPage from './_components/BooksClientPage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Quản lý sách — SocialBook Admin',
  description: 'Quản lý danh sách sách trong hệ thống',
};

export default function AdminBooksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <BooksClientPage />
    </Suspense>
  );
}
