import { Suspense } from 'react';
import ModerationClientPage from './_components/ModerationClientPage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Kiểm duyệt nội dung — SocialBook Admin',
  description: 'Quản lý và duyệt các bài viết bị báo cáo vi phạm',
};

export default function AdminModerationQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <ModerationClientPage />
    </Suspense>
  );
}
