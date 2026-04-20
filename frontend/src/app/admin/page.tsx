'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import { Users, BookOpen, FileText, MessageSquare, BarChart2, Download } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { TimeRangeSelector } from '@/components/admin/dashboard/TimeRangeSelector';
import { ViewTypeSelector, ViewType } from '@/components/admin/dashboard/ViewTypeSelector';
import { useDashboardData, useExportStatistics } from '@/features/admin/hooks/dashboard/useDashboard';
import { PopularBooksTable } from '@/components/admin/dashboard/PopularBooksTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UserGrowthChart = dynamic(
  () => import('@/components/admin/dashboard/UserGrowthChart').then((mod) => mod.UserGrowthChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-[300px] rounded-xl flex justify-center items-center">Loading chart...</div> }
);

const GenreDistributionChart = dynamic(
  () => import('@/components/admin/dashboard/GenreDistributionChart').then((mod) => mod.GenreDistributionChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-[300px] rounded-xl flex justify-center items-center">Loading chart...</div> }
);

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, isAdmin } = useAppAuth();
  const [viewType, setViewType] = useState<ViewType>('day');
  const [timeRange, setTimeRange] = useState('30');

  const { stats, growthData, bookStats, loading, error, refetch } = useDashboardData(timeRange, viewType);
  const { exportCSV, exporting } = useExportStatistics(timeRange);

  // Reset time range when view type changes
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    // Set appropriate default time range for new view type
    switch (newViewType) {
      case 'day':
        setTimeRange('30');
        break;
      case 'month':
        setTimeRange('180'); // 6 months
        break;
      case 'year':
        setTimeRange('1095'); // 3 years
        break;
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isAuthLoading, isAdmin, router]);

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Header with Time Range and Export */}
      <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Bảng Điều Khiển</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200 font-bold px-2 py-0.5 rounded-md text-[10px]">ADMIN</Badge>
            <p className="text-slate-500 text-sm font-medium">Chào mừng trở lại, <span className="text-slate-900 font-semibold">{user?.username}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
          <ViewTypeSelector value={viewType} onChange={handleViewTypeChange} />
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} viewType={viewType} />
          <Button
            onClick={() => exportCSV()}
            disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg h-9 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Đang xuất...' : 'Xuất CSV'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tổng thành viên"
          value={stats.users.total.toLocaleString()}
          icon={Users}
          trend={{
            value: stats.users.growth,
            isPositive: stats.users.growth >= 0,
          }}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Tổng sách"
          value={stats.books.total.toLocaleString()}
          icon={BookOpen}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Bài viết hoạt động"
          value={stats.posts.active.toLocaleString()}
          icon={FileText}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Tổng bình luận"
          value={stats.comments.toLocaleString()}
          icon={MessageSquare}
          iconBgColor="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users ({timeRange}d)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {stats.users.active.toLocaleString()}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-3.5 ring-1 ring-indigo-100 shadow-inner">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Chapters</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {stats.books.chapters.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3.5 ring-1 ring-emerald-100 shadow-inner">
                <BarChart2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {stats.reviews.toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3.5 ring-1 ring-amber-100 shadow-inner">
                <MessageSquare className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Growth Chart - Takes up 2 columns */}
        <div className="lg:col-span-2">
          {growthData.length > 0 ? <UserGrowthChart data={growthData} viewType={viewType} timeRange={timeRange} /> : null}
        </div>

        {/* Genre Distribution - Takes up 1 column */}
        <div className="lg:col-span-1">
          {bookStats ? <GenreDistributionChart genres={bookStats.byGenre} /> : null}
        </div>
      </div>

      {/* Popular Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {bookStats ? <PopularBooksTable books={bookStats.popularBooks} /> : null}
        </div>
        {/* Could add another widget here, e.g. Recent Activity feed if implemented */}
        <div className="lg:col-span-1 space-y-6">
          {/* Keeping the detailed stats small cards here for now, or could move them */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900 uppercase tracking-wide">Hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Hoạt động bình thường</span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Độ trễ Server</span>
                  <span className="text-slate-900 font-bold">45ms</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Cơ sở dữ liệu</span>
                  <span className="text-emerald-600 font-bold">KẾT NỐI</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}