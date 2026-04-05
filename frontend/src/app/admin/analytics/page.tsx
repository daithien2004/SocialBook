'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetActiveUsersQuery,
  useGetChapterEngagementQuery,
  useGetGeographicDistributionQuery,
  useGetReadingHeatmapQuery,
} from '@/features/admin/api/analyticsApi';
import { Activity, Globe, TrendingUp, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const ReadingHeatmapChart = dynamic(
  () =>
    import('@/components/admin/analytics/ReadingHeatmapChart').then(
      (module) => module.ReadingHeatmapChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Loading chart...
      </div>
    ),
  }
);

const GeographicDistributionMap = dynamic(
  () =>
    import('@/components/admin/analytics/GeographicDistributionMap').then(
      (module) => module.GeographicDistributionMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center text-gray-400">
        Loading map...
      </div>
    ),
  }
);

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto min-h-screen space-y-6 bg-gray-50 p-6">
      <ActiveUsersCard />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ReadingHeatmapCard />
          <div className="grid grid-cols-1 gap-6">
            <GeographicCard />
          </div>
        </div>

        <div className="lg:col-span-1">
          <ChapterEngagementCard />
        </div>
      </div>
    </div>
  );
}

function ActiveUsersCard() {
  const { data, isLoading, refetch } = useGetActiveUsersQuery();
  const [count, setCount] = useState(0);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (data?.count === undefined) {
      return;
    }

    const start = previousCountRef.current;
    const end = data.count;
    const duration = 1000;
    const stepTime = 50;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    let current = start;
    const timer = setInterval(() => {
      current += increment;

      if (
        (increment > 0 && current >= end) ||
        (increment < 0 && current <= end)
      ) {
        previousCountRef.current = end;
        setCount(end);
        clearInterval(timer);
        return;
      }

      setCount(Math.round(current));
    }, stepTime);

    return () => clearInterval(timer);
  }, [data?.count]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <Card className="border-0 bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <CardHeader className="border-b border-gray-100 pb-2">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          Độc giả đang hoạt động (Trực tiếp)
        </CardTitle>
        <CardDescription className="text-gray-500">
          Đang đọc trong 5 phút qua
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="text-6xl font-bold text-gray-300">--</div>
        ) : (
          <div className="text-7xl font-bold text-blue-600">{count}</div>
        )}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          <p className="text-sm font-medium text-blue-700">
            Trực tiếp • Cập nhật mỗi 30s
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadingHeatmapCard() {
  const { data, isLoading, error } = useGetReadingHeatmapQuery();
  const heatmapData = Array.isArray(data) ? data : [];

  return (
    <Card className="border-0 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="border-b border-gray-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="rounded-lg bg-amber-50 p-2">
            <Activity className="h-5 w-5 text-amber-600" />
          </div>
          Biểu đồ nhiệt hoạt động đọc
        </CardTitle>
        <CardDescription>Hoạt động đọc theo giờ trong ngày</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="flex h-64 items-center justify-center text-gray-400">
            Loading...
          </div>
        )}
        {error && (
          <div className="flex h-64 items-center justify-center font-medium text-red-500">
            Error loading data
          </div>
        )}
        {heatmapData.length > 0 && <ReadingHeatmapChart data={heatmapData} />}
      </CardContent>
    </Card>
  );
}

function ChapterEngagementCard() {
  const { data, isLoading, error } = useGetChapterEngagementQuery({ limit: 5 });
  const engagementData = Array.isArray(data) ? data : [];

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

function GeographicCard() {
  const { data, isLoading, error } = useGetGeographicDistributionQuery();
  const geoData = Array.isArray(data) ? data : [];

  return (
    <Card className="col-span-1 border-0 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg lg:col-span-2">
      <CardHeader className="border-b border-gray-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="rounded-lg bg-cyan-50 p-2">
            <Globe className="h-5 w-5 text-cyan-600" />
          </div>
          Phân bố địa lý
        </CardTitle>
        <CardDescription>
          Độc giả theo quốc gia (Bản đồ tương tác)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="flex h-[400px] items-center justify-center text-gray-400">
            Đang tải...
          </div>
        )}
        {error && (
          <div className="flex h-[400px] items-center justify-center font-medium text-red-500">
            Lỗi tải dữ liệu
          </div>
        )}
        {geoData.length > 0 && (
          <div className="w-full">
            <GeographicDistributionMap data={geoData} />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {geoData.slice(0, 4).map((country) => (
                <div
                  key={country.country}
                  className="flex flex-col items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {country.country}
                  </span>
                  <span className="mt-2 rounded-full bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-700">
                    {country.userCount} người dùng
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
