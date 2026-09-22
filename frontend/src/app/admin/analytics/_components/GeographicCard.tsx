'use client';

import { useAnalyticsData } from '@/features/admin/hooks/analytics/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import dynamic from 'next/dynamic';

const GeographicDistributionMap = dynamic(
  () =>
    import('@/features/admin/components/analytics/GeographicDistributionMap').then(
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

export default function GeographicCard() {
  const { geographic: { data: geoData, isLoading, error } } = useAnalyticsData();

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
