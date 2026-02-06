'use client';

import { NotificationBell } from '@/src/components/notification/NotificationBell';
import {
  useCheckInStreakMutation,
  useGetDailyGoalQuery,
  useGetStreakQuery,
} from '@/src/features/gamification/api/gamificationApi';
import { useAppAuth } from '@/src/hooks/useAppAuth';
import {
  BookOpen,
  Flame,
  Globe,
  Library,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { logout } from '../features/auth/slice/authSlice';
import { recommendationsApi } from '../features/recommendations/api/recommendationsApi';

import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/src/components/ui/sheet';

export function HeaderClient() {
  const router = useRouter();
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

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <BookOpen className="w-6 h-6 text-foreground stroke-[1.5px] hover:scale-110 transition-transform duration-300" />
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight hover:text-muted-foreground transition-colors">
              SocialBook
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/books')} className="gap-2 text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
              Tìm Kiếm Sách
            </Button>
            <Button variant="ghost" onClick={() => router.push('/posts')} className="gap-2 text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
              Bảng Feed
            </Button>
            <Button variant="ghost" onClick={() => router.push('/library')} className="gap-2 text-muted-foreground hover:text-foreground">
              <Library className="w-4 h-4" />
              Thư viện
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-muted-foreground hover:text-foreground"
              title="Đổi giao diện"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {isAuthenticated && user ? (
              <>
                {/* Daily Goal Display */}
                {dailyGoal && (
                  <div
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${(dailyGoal.goals?.minutes?.current || 0) >= (dailyGoal.goals?.minutes?.target || 90)
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
                    className={`w-4 h-4 ${streakData?.currentStreak > 0
                        ? 'fill-orange-500 text-orange-500'
                        : 'text-orange-300'
                      }`}
                  />
                  <span className="text-sm font-bold font-mono">
                    {streakData?.currentStreak || 0}
                  </span>
                </div>

                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full px-0 hover:bg-transparent">
                      <Avatar className="h-9 w-9 border border-border shadow-sm">
                        <AvatarImage src={avatarUrl} alt={user.name || 'User'} />
                        <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!user.onboardingCompleted && (
                      <DropdownMenuItem onClick={() => router.push('/onboarding')} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                        <Flame className="mr-2 h-4 w-4" />
                        <span>Tiếp tục Onboarding</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push(`/users/${userId}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ của tôi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/library')}>
                      <Library className="mr-2 h-4 w-4" />
                      <span>Thư viện</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* router.push('/settings') */ }}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Avatar>
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push(`/users/${userId}`)}>
                        <User className="w-4 h-4" /> Hồ sơ
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/books')}>
                        <Search className="w-4 h-4" /> Tìm sách
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/posts')}>
                        <Globe className="w-4 h-4" /> Bảng feed
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/library')}>
                        <Library className="w-4 h-4" /> Thư viện
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="gap-2 border-primary/20 hover:border-primary text-primary hover:text-primary hover:bg-primary/5"
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
