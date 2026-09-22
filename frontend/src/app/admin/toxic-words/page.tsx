import { Suspense } from 'react';
import ToxicWordsClientPage from './_components/ToxicWordsClientPage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Từ khóa thô tục — SocialBook Admin',
  description: 'Quản lý từ khóa và quy tắc kiểm duyệt nội dung thô tục',
};

export default function ToxicWordsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <ToxicWordsClientPage />
    </Suspense>
  );
}
