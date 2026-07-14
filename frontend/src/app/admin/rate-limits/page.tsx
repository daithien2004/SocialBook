'use client';

import { Gauge, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRateLimitManagement } from '@/features/admin/hooks/rate-limits/useRateLimitManagement';

export default function RateLimitsPage() {
  const {
    config,
    isLoading,
    guestLimit,
    userLimit,
    setGuestLimit,
    setUserLimit,
    handleSave,
    isSaving,
    hasChanges,
  } = useRateLimitManagement();

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rate Limits</h1>
        <p className="text-gray-500 mt-1">
          Cấu hình giới hạn yêu cầu cho Gemini AI chat
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-indigo-600" />
            <CardTitle>Gemini AI</CardTitle>
          </div>
          <CardDescription>
            Giới hạn số lượng yêu cầu mỗi phút
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest limit (yêu cầu/phút)
            </label>
            <input
              type="number"
              min={1}
              value={guestLimit}
              onChange={(e) => setGuestLimit(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {config ? `Hiện tại: ${config.guestLimit}` : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User limit (yêu cầu/phút)
            </label>
            <input
              type="number"
              min={1}
              value={userLimit}
              onChange={(e) => setUserLimit(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {config ? `Hiện tại: ${config.userLimit}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
