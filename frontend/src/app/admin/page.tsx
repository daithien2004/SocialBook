'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Users, BookOpen, FileText, MessageSquare, BarChart2, Download } from 'lucide-react';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { UserGrowthChart } from '@/components/admin/dashboard/UserGrowthChart';
import { TimeRangeSelector } from '@/components/admin/dashboard/TimeRangeSelector';
import { ViewTypeSelector, ViewType } from '@/components/admin/dashboard/ViewTypeSelector';
import { useDashboardData, useExportStatistics } from '@/features/admin/hooks/useDashboard';
import { PopularBooksTable } from '@/components/admin/dashboard/PopularBooksTable';
import { GenreDistributionChart } from '@/components/admin/dashboard/GenreDistributionChart';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, isAdmin } = useAppAuth();
  const [viewType, setViewType] = useState<ViewType>('day');
  const [timeRange, setTimeRange] = useState('30');

  const { stats, growthData, bookStats, loading, error, refetch } = useDashboardData(timeRange, viewType);
  const { exportCSV, exporting } = useExportStatistics();

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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Time Range and Export */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bảng Điều Khiển Admin</h1>
          <p className="text-gray-600 dark:text-gray-400">Chào mừng trở lại, {user?.username}!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ViewTypeSelector value={viewType} onChange={handleViewTypeChange} />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} viewType={viewType} />
          <button
            onClick={() => exportCSV(timeRange)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Thành viên hoạt động ({timeRange}d qua)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.users.active.toLocaleString()}
              </p>
            </div>
            <div className="bg-indigo-50 rounded-full p-3">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng số chương</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.books.chapters.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-full p-3">
              <BarChart2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng đánh giá</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.reviews.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 rounded-full p-3">
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Growth Chart - Takes up 2 columns */}
        <div className="lg:col-span-2">
          {growthData.length > 0 && <UserGrowthChart data={growthData} viewType={viewType} timeRange={timeRange} />}
        </div>

        {/* Genre Distribution - Takes up 1 column */}
        <div className="lg:col-span-1">
          {bookStats && <GenreDistributionChart genres={bookStats.byGenre} />}
        </div>
      </div>

      {/* Popular Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {bookStats && <PopularBooksTable books={bookStats.popularBooks} />}
        </div>
        {/* Could add another widget here, e.g. Recent Activity feed if implemented */}
        <div className="lg:col-span-1 space-y-6">
          {/* Keeping the detailed stats small cards here for now, or could move them */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Trạng thái hệ thống</h3>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Tất cả hệ thống hoạt động</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Độ trễ máy chủ</span>
                <span className="text-gray-900 dark:text-white font-medium">45ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Trạng thái cơ sở dữ liệu</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Đã kết nối</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}