'use client';

import { useAnalyticsData } from '@/features/admin/hooks/analytics/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import dynamic from 'next/dynamic';

const ReadingHeatmapChart = dynamic(
  () =>
    import('@/features/admin/components/analytics/ReadingHeatmapChart').then(
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

export default function ReadingHeatmapCard() {
  const { heatmap: { data: heatmapData, isLoading, error } } = useAnalyticsData();

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
