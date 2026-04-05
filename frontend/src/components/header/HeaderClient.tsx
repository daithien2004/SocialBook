'use client';

import dynamic from 'next/dynamic';
import { useAppAuth, useLogout } from '@/features/auth/hooks';
import { useHeaderNavigation } from './hooks/useHeaderNavigation';
import { useHeaderTheme } from './hooks/useHeaderTheme';
import { BookOpen, Flame, Globe, Library, Moon, Search, Sun } from 'lucide-react';
import { memo } from 'react';
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
    const { user, isAuthenticated, isGuest } = useAppAuth();
    const { handleLogout } = useLogout();
    const { navigateToHome, navigateToBooks, navigateToPosts, navigateToLibrary, navigateToProfile, navigateToOnboarding, navigateToSettings, navigateToLogin } = useHeaderNavigation();
    const { theme, toggleTheme, mounted } = useHeaderTheme();

    const userId = user?.id;
    const avatarUrl = user?.image;

    return (
        <header className="fixed top-0 z-50 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    <Logo onClick={navigateToHome} />

                    <HeaderNav onBooks={navigateToBooks} onPosts={navigateToPosts} onLibrary={navigateToLibrary} />

                    <div className="flex items-center gap-2">
                        <ThemeToggle mounted={mounted} theme={theme} onToggle={toggleTheme} />

                        {isAuthenticated && user ? (
                            <>
                                {!isGuest && <LazyHeaderGamificationSummary userId={userId} />}
                                <LazyNotificationBell />
                                <UserDropdown
                                    user={user}
                                    avatarUrl={avatarUrl}
                                    onProfile={() => userId && navigateToProfile(userId)}
                                    onLibrary={navigateToLibrary}
                                    onSettings={navigateToSettings}
                                    onOnboarding={navigateToOnboarding}
                                    onLogout={handleLogout}
                                />
                                <MobileMenu
                                    user={user}
                                    avatarUrl={avatarUrl}
                                    onProfile={() => userId && navigateToProfile(userId)}
                                    onBooks={navigateToBooks}
                                    onPosts={navigateToPosts}
                                    onLibrary={navigateToLibrary}
                                    onSettings={navigateToSettings}
                                    onLogout={handleLogout}
                                />
                            </>
                        ) : (
                            <Button onClick={navigateToLogin} variant="outline" className="gap-2 border-primary/20 hover:border-primary text-primary hover:text-primary hover:bg-primary/5">
                                Đăng nhập
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});

function Logo({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
            <BookOpen className="w-6 h-6 text-foreground stroke-[1.5px] hover:scale-110 transition-transform duration-300" />
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight hover:text-muted-foreground transition-colors">
                SocialBook
            </h1>
        </div>
    );
}

function HeaderNav({ onBooks, onPosts, onLibrary }: { onBooks: () => void; onPosts: () => void; onLibrary: () => void }) {
    return (
        <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={onBooks} className="gap-2 text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4" />
                Tìm Kiếm Sách
            </Button>
            <Button variant="ghost" onClick={onPosts} className="gap-2 text-muted-foreground hover:text-foreground">
                <Globe className="w-4 h-4" />
                Bảng Feed
            </Button>
            <Button variant="ghost" onClick={onLibrary} className="gap-2 text-muted-foreground hover:text-foreground">
                <Library className="w-4 h-4" />
                Thư viện
            </Button>
        </nav>
    );
}

function ThemeToggle({ mounted, theme, onToggle }: { mounted: boolean; theme: string | undefined; onToggle: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="rounded-full text-muted-foreground hover:text-foreground"
            title="Đổi giao diện"
        >
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
    );
}

interface UserDropdownProps {
    user: { name?: string | null; email?: string | null; username?: string; onboardingCompleted?: boolean };
    avatarUrl?: string;
    onProfile: () => void;
    onLibrary: () => void;
    onSettings: () => void;
    onOnboarding: () => void;
    onLogout: () => void;
}

function UserDropdown({ user, avatarUrl, onProfile, onLibrary, onSettings, onOnboarding, onLogout }: UserDropdownProps) {
    return (
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
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!user.onboardingCompleted && (
                    <DropdownMenuItem onClick={onOnboarding} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                        <Flame className="mr-2 h-4 w-4" />
                        <span>Tiếp tục Onboarding</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onProfile}>
                    <span className="mr-2 h-4 w-4">👤</span>
                    <span>Hồ sơ của tôi</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLibrary}>
                    <span className="mr-2 h-4 w-4">📚</span>
                    <span>Thư viện</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSettings}>
                    <span className="mr-2 h-4 w-4">⚙️</span>
                    <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                    <span className="mr-2 h-4 w-4">🚪</span>
                    <span>Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface MobileMenuProps {
    user: { name?: string | null; email?: string | null; username?: string };
    avatarUrl?: string;
    onProfile: () => void;
    onBooks: () => void;
    onPosts: () => void;
    onLibrary: () => void;
    onSettings: () => void;
    onLogout: () => void;
}

function MobileMenu({ user, avatarUrl, onProfile, onBooks, onPosts, onLibrary, onSettings, onLogout }: MobileMenuProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <span className="sr-only">Menu</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
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
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={onProfile}>
                            👤 Hồ sơ cá nhân
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={onSettings}>
                            ⚙️ Cài đặt tài khoản
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={onBooks}>
                            🔍 Tìm kiếm sách
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={onPosts}>
                            🌍 Bảng tin cộng đồng
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl font-medium" onClick={onLibrary}>
                            📚 Thư viện của tôi
                        </Button>
                    </div>

                    <Separator className="my-2" />

                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold" onClick={onLogout}>
                        🚪 Đăng xuất
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
