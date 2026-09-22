import { Suspense } from 'react';
import GenresClientPage from './_components/GenresClientPage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Quản lý thể loại — SocialBook Admin',
  description: 'Quản lý các thể loại sách trong hệ thống',
};

export default function AdminGenresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <GenresClientPage />
    </Suspense>
  );
}
