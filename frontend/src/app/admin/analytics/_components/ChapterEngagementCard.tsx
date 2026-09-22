'use client';

import { useAnalyticsData } from '@/features/admin/hooks/analytics/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function ChapterEngagementCard() {
  const { engagement: { data: engagementData, isLoading, error } } = useAnalyticsData();

  return (
    <Card className="border-0 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="border-b border-gray-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="rounded-lg bg-green-50 p-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          Chương có tương tác cao nhất
        </CardTitle>
        <CardDescription>
          Các chương được đọc nhiều nhất với tỷ lệ hoàn thành
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="flex h-64 items-center justify-center text-gray-400">
            Đang tải...
          </div>
        )}
        {error && (
          <div className="flex h-64 items-center justify-center font-medium text-red-500">
            Lỗi tải dữ liệu
          </div>
        )}
        {engagementData.length === 0 && !isLoading && (
          <div className="flex h-64 items-center justify-center text-gray-400">
            Chưa có dữ liệu
          </div>
        )}
        {engagementData.length > 0 && (
          <div className="space-y-4">
            {engagementData.map((chapter) => (
              <div
                key={chapter.chapterId}
                className="rounded-lg border border-gray-100 p-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {chapter.chapterTitle}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {chapter.bookTitle}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {chapter.viewCount}
                    </p>
                    <p className="text-xs text-gray-500">lượt xem</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${chapter.completionRate}%` }}
                    />
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                    {chapter.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
