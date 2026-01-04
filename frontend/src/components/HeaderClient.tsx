'use client';

import {
  BookOpen,
  Globe,
  Search,
  Library,
  ChevronDown,
  Moon,
  Sun,
  Flame,
  Target,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { NotificationBell } from '@/src/components/notification/NotificationBell';
import {
  useGetStreakQuery,
  useCheckInStreakMutation,
  useGetDailyGoalQuery,
} from '@/src/features/gamification/api/gamificationApi';
import { toast } from 'sonner';
import { useAppAuth } from '@/src/hooks/useAppAuth';
import { useDispatch } from 'react-redux';
import { recommendationsApi } from '../features/recommendations/api/recommendationsApi';
import { logout } from '../features/auth/slice/authSlice';

export function HeaderClient() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated, isGuest } = useAppAuth();

  const userId = user?.id;
  const avatarUrl = user?.image;

  const { data: streakData } = useGetStreakQuery(undefined, {
    skip: isGuest,
  });

  const [checkInStreak] = useCheckInStreakMutation();

  const { data: dailyGoal } = useGetDailyGoalQuery(undefined, {
    skip: isGuest,
  });


  useEffect(() => {
    setMounted(true);

    if (dailyGoal && userId) {
       const minutesGoal = dailyGoal.goals?.minutes;
       const current = minutesGoal?.current || 0;
       const target = minutesGoal?.target || 90;
       
       const todayStr = new Date().toISOString().split('T')[0];
       const celebrationKey = `daily-goal-celebrated-${userId}-${todayStr}`;
       const hasCelebratedToday = localStorage.getItem(celebrationKey);

       if (current >= target && !hasCelebratedToday) {
          localStorage.setItem(celebrationKey, 'true');
          import('canvas-confetti').then((confetti) => {
            confetti.default({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.3 },
              colors: ['#FFD700', '#FFA500', '#ffffff'],
            });
          });
          toast.success('Xuất sắc! Bạn đã đạt mục tiêu hôm nay! 🎉');
       }
    }

    if (isAuthenticated) {
      const performCheckIn = async () => {
        try {
          const result = await checkInStreak().unwrap();

          if (result.message === 'Streak updated') {
            toast.success(`Streak updated! ${result.currentStreak} day(s) 🔥`, {
              icon: '🔥',
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              },
            });
          }
        } catch (error) {
        }
      };
      performCheckIn();
    }
  }, [isAuthenticated, checkInStreak, dailyGoal]);

  const dispatch = useDispatch();

  const handleLogout = async () => {
    dispatch(recommendationsApi.util.resetApiState());
    dispatch(logout());
    await signOut({ redirect: false });
    router.push('/login');
  };

  const goTo = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-white/80 dark:bg-black backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div
            className="flex items-center gap-3 group cursor-pointer"
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
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              title="Đổi giao diện"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isAuthenticated && user ? (
              <>
                {/* Daily Goal Display */}
                {dailyGoal && (
                  <div
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                      (dailyGoal.goals?.minutes?.current || 0) >= (dailyGoal.goals?.minutes?.target || 90)
                        ? 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                    title="Mục tiêu đọc sách hôm nay"
                  >
                    {(dailyGoal.goals?.minutes?.current || 0) >= (dailyGoal.goals?.minutes?.target || 90) ? (
                      <Trophy className="w-4 h-4" />
                    ) : (
                      <Target className="w-4 h-4" />
                    )}
                    <span className="text-sm font-bold font-mono">
                      {dailyGoal.goals?.minutes?.current || 0}/{dailyGoal.goals?.minutes?.target || 90}p
                    </span>
                  </div>
                )}

                {/* Streak Display */}
                <div
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400"
                  title="Chuỗi ngày đọc sách liên tiếp"
                >
                  <Flame
                    className={`w-4 h-4 ${
                      streakData?.currentStreak > 0
                        ? 'fill-orange-500 text-orange-500'
                        : 'text-orange-300'
                    }`}
                  />
                  <span className="text-sm font-bold font-mono">
                    {streakData?.currentStreak || 0}
                  </span>
                </div>

                <NotificationBell />
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
                          {user.name || 'Người dùng'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">
                        {!user.onboardingCompleted && (
                           <button
                             onClick={() => goTo('/onboarding')}
                             className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/10"
                           >
                             <Flame className="w-4 h-4 mr-2" />
                             Tiếp tục Onboarding
                           </button>
                        )}
                        <div className="px-4 py-2 sm:hidden flex items-center justify-between text-sm text-gray-700 dark:text-gray-200">
                          <span className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />{' '}
                            Currently Streak
                          </span>
                          <span className="font-bold">
                            {streakData?.currentStreak || 0}
                          </span>
                        </div>
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
