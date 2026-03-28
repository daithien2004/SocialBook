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
import { useEffect, useState } from 'react';
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

export function HeaderClient() {
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
              TÃ¬m Kiáº¿m SÃ¡ch
            </Button>
            <Button variant="ghost" onClick={() => router.push('/posts')} className="gap-2 text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
              Báº£ng Feed
            </Button>
            <Button variant="ghost" onClick={() => router.push('/library')} className="gap-2 text-muted-foreground hover:text-foreground">
              <Library className="w-4 h-4" />
              ThÆ° viá»‡n
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-muted-foreground hover:text-foreground"
              title="Äá»•i giao diá»‡n"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {isAuthenticated && user ? (
              <>
                {!isGuest && <LazyHeaderGamificationSummary userId={userId} />}

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
                    {!user.onboardingCompleted && (
                      <DropdownMenuItem onClick={() => router.push('/onboarding')} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                        <Flame className="mr-2 h-4 w-4" />
                        <span>Tiáº¿p tá»¥c Onboarding</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push(`/users/${userId}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Há»“ sÆ¡ cá»§a tÃ´i</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/library')}>
                      <Library className="mr-2 h-4 w-4" />
                      <span>ThÆ° viá»‡n</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* router.push('/settings') */ }}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>CÃ i Ä‘áº·t</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>ÄÄƒng xuáº¥t</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
                        <User className="w-4 h-4" /> Há»“ sÆ¡
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/books')}>
                        <Search className="w-4 h-4" /> TÃ¬m sÃ¡ch
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/posts')}>
                        <Globe className="w-4 h-4" /> Báº£ng feed
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/library')}>
                        <Library className="w-4 h-4" /> ThÆ° viá»‡n
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" /> ÄÄƒng xuáº¥t
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
                ÄÄƒng nháº­p
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
