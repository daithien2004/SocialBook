'use client';

import { BookOpen, Globe, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* 1. Logo Section: Minimal & Serif */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            {/* Icon đơn giản, không background màu mè */}
            <BookOpen className="w-6 h-6 text-gray-900 stroke-[1.5px] group-hover:scale-110 transition-transform duration-300" />

            {/* Tên thương hiệu dùng font Serif sang trọng */}
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors">
              SocialBook
            </h1>
          </div>

          {/* 2. Navigation: Clean Text Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => router.push('/books')}
              className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
            >
              <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              Tìm Kiếm Sách
            </button>

            <button
              onClick={() => router.push('/posts')}
              className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
            >
              <Globe className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              Bảng Feed
            </button>
          </nav>

          {/* 3. Action: Minimal Logout */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-sm border border-gray-200 text-sm font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
          >
            <span className="hidden sm:inline">Đăng xuất</span>
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
