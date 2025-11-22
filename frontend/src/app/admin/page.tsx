'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Home, Users, BookOpen, FileText, MessageSquare, BarChart2, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/admin/dashboard' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Books', icon: BookOpen, href: '/admin/books' },
  { name: 'Posts', icon: FileText, href: '/admin/posts' },
  { name: 'Comments', icon: MessageSquare, href: '/admin/comments' },
  { name: 'Reports', icon: BarChart2, href: '/admin/reports' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalPosts: 0,
    totalComments: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role === 'admin') {
    const { user } = session;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}



        {/* Main Content  */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-md p-4 flex items-center justify-between md:px-8">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 md:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.username || 'Admin'}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-indigo-100"
                />
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="p-4 md:p-8 flex-1">
            {/* Welcome */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Xin chào, {user.username || 'Admin'}!
              </h2>
              <p className="text-gray-600">Quản lý hệ thống SocialBook của bạn</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số người dùng</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-50 rounded-full p-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số sách</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBooks}</p>
                  </div>
                  <div className="bg-green-50 rounded-full p-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số bài viết</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPosts}</p>
                  </div>
                  <div className="bg-purple-50 rounded-full p-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số bình luận</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComments}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-full p-3">
                    <MessageSquare className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý người dùng</h3>
                <p className="text-gray-600 mb-4">Xem danh sách người dùng, quản lý quyền truy cập và tài khoản</p>
                <a
                  href="/admin/users"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Quản lý người dùng
                </a>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý sách</h3>
                <p className="text-gray-600 mb-4">Thêm, sửa, xóa sách và quản lý nội dung trong hệ thống</p>
                <a
                  href="/admin/books"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Quản lý sách
                </a>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý bài viết</h3>
                <p className="text-gray-600 mb-4">Kiểm duyệt và quản lý các bài viết của người dùng</p>
                <a
                  href="/admin/posts"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Quản lý bài viết
                </a>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Báo cáo & Thống kê</h3>
                <p className="text-gray-600 mb-4">Xem báo cáo chi tiết và thống kê hoạt động của hệ thống</p>
                <a
                  href="/admin/reports"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Xem báo cáo
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Home className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Người dùng mới đăng ký</p>
                    <p className="text-xs text-gray-500">2 giờ trước</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Sách mới được thêm</p>
                    <p className="text-xs text-gray-500">5 giờ trước</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Bài viết được cập nhật</p>
                    <p className="text-xs text-gray-500">1 ngày trước</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
}