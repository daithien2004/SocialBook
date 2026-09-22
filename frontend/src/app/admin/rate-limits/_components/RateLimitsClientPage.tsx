'use client';

import { Gauge, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRateLimitManagement } from '@/features/admin/hooks/rate-limits/useRateLimitManagement';

export default function RateLimitsClientPage() {
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
    <div className="p-6 flex flex-col h-full bg-slate-50/50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rate Limits</h1>
        <p className="text-gray-500 mt-1">
          Cấu hình giới hạn số lượng yêu cầu API cho Gemini AI
        </p>
      </div>

      <Card className="max-w-xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Gauge className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Gemini AI Limits</CardTitle>
              <CardDescription className="mt-1">
                Điều chỉnh số lượng yêu cầu tối đa mỗi phút để tránh spam
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="guestLimit" className="text-sm font-semibold text-slate-700">
              Khách vãng lai (Guest Limit)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="guestLimit"
                type="number"
                min={1}
                value={guestLimit}
                onChange={(e) => setGuestLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 font-medium"
              />
              <span className="text-sm text-slate-500">yêu cầu / phút</span>
            </div>
            <p className="text-xs text-slate-400">
              {config ? `Hiện đang áp dụng: ${config.guestLimit}` : ''}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userLimit" className="text-sm font-semibold text-slate-700">
              Người dùng đã đăng nhập (User Limit)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="userLimit"
                type="number"
                min={1}
                value={userLimit}
                onChange={(e) => setUserLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 font-medium"
              />
              <span className="text-sm text-slate-500">yêu cầu / phút</span>
            </div>
            <p className="text-xs text-slate-400">
              {config ? `Hiện đang áp dụng: ${config.userLimit}` : ''}
            </p>
          </div>

          <div className="flex items-center pt-4 mt-4 border-t border-slate-100">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-2 ${hasChanges && !isSaving ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
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
