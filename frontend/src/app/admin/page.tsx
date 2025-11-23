'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, BookOpen, FileText, MessageSquare, BarChart2, Download } from 'lucide-react';
import { StatCard } from '@/src/components/admin/StatCard';
import { UserGrowthChart } from '@/src/components/admin/UserGrowthChart';
import { TimeRangeSelector } from '@/src/components/admin/TimeRangeSelector';
import { useDashboardData, useExportStatistics } from '@/src/features/admin/hooks/useDashboard';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState('30');

  const { stats, growthData, loading, error, refetch } = useDashboardData(timeRange);
  const { exportCSV, exporting } = useExportStatistics();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.username}!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button
            onClick={() => exportCSV(timeRange)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
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
          title="Total Books"
          value={stats.books.total.toLocaleString()}
          icon={BookOpen}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Active Posts"
          value={stats.posts.active.toLocaleString()}
          icon={FileText}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Comments"
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
              <p className="text-sm font-medium text-gray-600">Active Users ({timeRange}d)</p>
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
              <p className="text-sm font-medium text-gray-600">Total Chapters</p>
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
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
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

      {/* Growth Chart */}
      {growthData.length > 0 && <UserGrowthChart data={growthData} />}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <a
          href="/admin/users"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Users</h3>
          <p className="text-gray-600 text-sm">
            View and manage users, ban/unban accounts
          </p>
        </a>

        <a
          href="/admin/books"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Books</h3>
          <p className="text-gray-600 text-sm">
            Add, edit, and manage books and chapters
          </p>
        </a>

        <a
          href="/admin/posts"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Moderate Posts</h3>
          <p className="text-gray-600 text-sm">
            Review and moderate user posts
          </p>
        </a>
      </div>
    </div>
  );
}