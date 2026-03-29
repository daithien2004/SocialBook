'use client';

import dynamic from 'next/dynamic';
import { useAppAuth } from '@/hooks/useAppAuth';
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
  User,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/slice/authSlice';
import { recommendationsApi } from '../features/recommendations/api/recommendationsApi';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const LazyNotificationBell = dynamic(
  () =>
    import('@/components/notification/NotificationBell').then(
      (module) => module.NotificationBell
    ),
  { ssr: false }
);

const LazyHeaderGamificationSummary = dynamic(
  () => import('@/components/header/HeaderGamificationSummary'),
  { ssr: false }
);

export const HeaderClient = memo(function HeaderClient() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated, isGuest } = useAppAuth();

  const userId = user?.id;
  const avatarUrl = user?.image;

  useEffect(() => {
    setMounted(true);
  }, []);

  const dispatch = useDispatch();

  const handleLogout = useCallback(async () => {
    dispatch(recommendationsApi.util.resetApiState());
    dispatch(logout());
    await signOut({ redirect: false });
    router.push('/login');
  }, [dispatch, router]);

  const toggleTheme = useCallback(() => {
    if (!mounted) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [mounted, theme, setTheme]);

  const navigateToHome = useCallback(() => router.push('/'), [router]);
  const navigateToBooks = useCallback(() => router.push('/books'), [router]);
  const navigateToPosts = useCallback(() => router.push('/posts'), [router]);
  const navigateToLibrary = useCallback(() => router.push('/library'), [router]);
  const navigateToProfile = useCallback(() => router.push(`/users/${userId}`), [router, userId]);
  const navigateToOnboarding = useCallback(() => router.push('/onboarding'), [router]);
  const navigateToFollowing = useCallback(() => router.push(`/users/${userId}/following`), [router, userId]);

  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={navigateToHome}
          >
            <BookOpen className="w-6 h-6 text-foreground stroke-[1.5px] hover:scale-110 transition-transform duration-300" />
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight hover:text-muted-foreground transition-colors">
              SocialBook
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={navigateToBooks} className="gap-2 text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
              Tìm Kiếm Sách
            </Button>
            <Button variant="ghost" onClick={navigateToPosts} className="gap-2 text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
              Bảng Feed
            </Button>
            <Button variant="ghost" onClick={navigateToLibrary} className="gap-2 text-muted-foreground hover:text-foreground">
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
              title="Ä á»•i giao diá»‡n"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {isAuthenticated && user ? (
              <>
                {!isGuest ? <LazyHeaderGamificationSummary userId={userId} /> : null}

                <LazyNotificationBell />

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
                    {!user.onboardingCompleted ? (
                      <DropdownMenuItem onClick={navigateToOnboarding} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                        <Flame className="mr-2 h-4 w-4" />
                        <span>Tiếp tục Onboarding</span>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={navigateToProfile}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ của tôi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={navigateToLibrary}>
                      <Library className="mr-2 h-4 w-4" />
                      <span>Thư viện</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
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

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <div className="flex flex-col gap-4 mt-8">
                      <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-gray-50 dark:bg-zinc-900">
                        <Avatar className="h-12 w-12 border-2 border-white dark:border-zinc-800 shadow-sm">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-blue-600 text-white font-bold">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-bold text-lg truncate">{user.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={navigateToProfile}>
                          <User className="w-5 h-5 text-muted-foreground" /> Hồ sơ cá nhân
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={() => router.push('/settings')}>
                          <Settings className="w-5 h-5 text-muted-foreground" /> Cài đặt tài khoản
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={navigateToBooks}>
                          <Search className="w-5 h-5 text-muted-foreground" /> Tìm kiếm sách
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={navigateToPosts}>
                          <Globe className="w-5 h-5 text-muted-foreground" /> Bảng tin cộng đồng
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={navigateToLibrary}>
                          <Library className="w-5 h-5 text-muted-foreground" /> Thư viện của tôi
                        </Button>
                      </div>

                      <Separator className="my-2" />

                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold" onClick={handleLogout}>
                        <LogOut className="w-5 h-5" /> Đăng xuất
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
  )
})


