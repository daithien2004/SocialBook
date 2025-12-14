'use client';

import {
  BookOpen,
  Globe,
  Search,
  Library,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { NotificationBell } from '@/src/components/notification/NotificationBell';
import { ChatWidget } from './ChatWidget';

type HeaderClientProps = {
  session: Session | null;
};

export function HeaderClient({ session }: HeaderClientProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isAuthenticated = !!session;
  const userId = session?.user.id as string | undefined;
  const avatarUrl = session?.user.image as string | undefined;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  const goTo = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
    // nếu muốn menu đóng lại sau khi đổi theme:
    // setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-white/80 dark:bg-black backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => router.push('/')}
          >
            <BookOpen className="w-6 h-6 text-gray-900 dark:text-white stroke-[1.5px] group-hover:scale-110 transition-transform duration-300" />

            <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              SocialBook
            </h1>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => router.push('/books')}
              className="group flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              Tìm Kiếm Sách
            </button>

            <button
              onClick={() => router.push('/posts')}
              className="group flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              Bảng Feed
            </button>

            <button
              onClick={() => router.push('/library')}
              className="group flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <Library className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              Thư viện
            </button>

            {/* ĐÃ BỎ ThemeToggle ở đây */}
          </nav>

          {/* Action */}
          <div className="flex items-center gap-3">
            {isAuthenticated && userId ? (
              <>
                <NotificationBell session={session} />
                {/* Avatar + Dropdown */}
                <div className="relative inline-flex items-center">
                  <button
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="flex items-center"
                  >
                    <img
                      src={avatarUrl || '/user.png'}
                      alt="User avatar"
                      className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-white/20 transition-transform shadow-sm"
                    />
                    <ChevronDown className="ml-1 w-4 h-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-11 mt-2 w-56 rounded-lg bg-white dark:bg-[#18181b] shadow-lg border border-gray-200 dark:border-zinc-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session?.user?.name || 'Người dùng'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {session?.user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => goTo(`/users/${userId}`)}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          Hồ sơ của tôi
                        </button>
                        <button
                          onClick={() => goTo('/library')}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          Thư viện
                        </button>
                        <button
                          // onClick={() => goTo("/settings/language")}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          Ngôn ngữ: Tiếng Việt
                        </button>

                        {/* Chủ đề */}
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          <span>
                            Chủ đề:{' '}
                            {mounted && theme === 'dark' ? 'Tối' : 'Sáng'}
                          </span>
                        </button>

                        <button
                          // onClick={() => goTo("/settings")}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          Cài đặt
                        </button>
                      </div>

                      <div className="border-t border-gray-100 dark:border-zinc-700">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
