import { Suspense } from 'react';
import ActiveUsersCard from './_components/ActiveUsersCard';
import ReadingHeatmapCard from './_components/ReadingHeatmapCard';
import ChapterEngagementCard from './_components/ChapterEngagementCard';
import GeographicCard from './_components/GeographicCard';

export const metadata = {
  title: 'Analytics — SocialBook Admin',
  description: 'Thống kê chi tiết về độc giả và hoạt động đọc sách',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto min-h-screen space-y-6 bg-gray-50 p-6">
      <Suspense fallback={<div className="h-44 animate-pulse bg-gray-100 rounded-xl" />}>
        <ActiveUsersCard />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
            <ReadingHeatmapCard />
          </Suspense>
          <div className="grid grid-cols-1 gap-6">
            <Suspense fallback={<div className="h-[400px] animate-pulse bg-gray-100 rounded-xl" />}>
              <GeographicCard />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
            <ChapterEngagementCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
