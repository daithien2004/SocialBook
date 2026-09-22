'use client';

import { useActiveUsers } from '@/features/admin/hooks/analytics/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ActiveUsersCard() {
  const { count, isLoading } = useActiveUsers();

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
