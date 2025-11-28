'use client';

import { BookOpen, Globe, LogOut, Search, Library } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const userId = session?.user.id;
  const avatarUrl = session?.user.image;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  const handleAvatarClick = () => {
    if (userId) {
      router.push(`/users/${userId}`);
    }
  };

  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-white/80 dark:bg-black backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            <BookOpen className="w-6 h-6 text-gray-900 dark:text-white stroke-[1.5px] group-hover:scale-110 transition-transform duration-300" />

            <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              SocialBook
            </h1>
          </div>

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

            <div className="pl-2 border-l border-gray-200 dark:border-white/10 ml-2">
              <ThemeToggle />
            </div>
          </nav>

          {/* 3. Action */}
          <div className="flex items-center gap-3">
            {isAuthenticated && userId ? (
              <>
                <button
                  onClick={handleLogout}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-red-200 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                >
                  <span className="hidden sm:inline">Đăng xuất</span>
                  <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={handleAvatarClick}
                  className="relative inline-flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={avatarUrl || '/user.png'}
                    alt="User avatar"
                    className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-white/20 hover:scale-105 transition-transform shadow-sm"
                  />
                </button>
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
