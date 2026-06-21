'use client';

import dynamic from 'next/dynamic';
import { useAppAuth, useLogout } from '@/features/auth/hooks';
import { useHeaderNavigation } from './hooks/useHeaderNavigation';
import { useHeaderTheme } from './hooks/useHeaderTheme';
import { useColorTheme } from './hooks/useColorTheme';
import { BookOpen, Globe, Library, LogOut, Menu, Moon, Network, Search, Sun, User, Users, Palette } from 'lucide-react';
import { memo } from 'react';
import { UserAvatar } from '@/components/common/UserAvatar';
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
import { SearchTrigger } from '@/components/search/SearchTrigger';

const LazyNotificationBell = dynamic(
    () =>
        import('@/components/notification/NotificationBell').then(
            (module) => module.NotificationBell
        ),
    { ssr: false }
);


export const HeaderClient = memo(function HeaderClient() {
    const { user, isAuthenticated } = useAppAuth();
    const { handleLogout } = useLogout();
    const { navigateToHome, navigateToBooks, navigateToPosts, navigateToLibrary, navigateToReadingRooms, navigateToProfile, navigateToKnowledgeMap, navigateToLogin } = useHeaderNavigation();

    const { theme, toggleTheme, mounted } = useHeaderTheme();
    const { colorTheme, toggleColorTheme, mounted: colorMounted } = useColorTheme();

    const userId = user?.id;
    const avatarUrl = user?.image;

    return (
        <header className="fixed top-0 z-50 w-full h-16 bg-background border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    <Logo onClick={navigateToHome} />

                    <HeaderNav onBooks={navigateToBooks} onPosts={navigateToPosts} onLibrary={navigateToLibrary} onReadingRooms={navigateToReadingRooms} />

                    <div className="flex items-center gap-2">
                        <ColorThemeToggle mounted={colorMounted} colorTheme={colorTheme} onToggle={toggleColorTheme} />
                        <ThemeToggle mounted={mounted} theme={theme} onToggle={toggleTheme} />

                        {isAuthenticated && user ? (
                            <>
                                <LazyNotificationBell />
                                <UserDropdown
                                    user={user}
                                    avatarUrl={avatarUrl}
                                    onProfile={() => userId && navigateToProfile(userId)}
                                    onLibrary={navigateToLibrary}
                                    onKnowledgeMap={navigateToKnowledgeMap}
                                    onLogout={handleLogout}
                                />
                                <MobileMenu
                                    user={user}
                                    avatarUrl={avatarUrl}
                                    onProfile={() => userId && navigateToProfile(userId)}
                                    onBooks={navigateToBooks}
                                    onPosts={navigateToPosts}
                                    onLibrary={navigateToLibrary}
                                    onReadingRooms={navigateToReadingRooms}
                                    onKnowledgeMap={navigateToKnowledgeMap}
                                    onLogout={handleLogout}
                                />
                            </>
                        ) : (
                            <Button onClick={navigateToLogin} variant="outline" className="gap-2 border-primary/20 hover:border-primary text-primary hover:text-primary hover:bg-primary/5 rounded-full">
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
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onClick}>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <BookOpen className="w-5 h-5 text-primary stroke-[2px]" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                SocialBook
            </h1>
        </div>
    );
}

function HeaderNav({ onBooks, onPosts, onLibrary, onReadingRooms }: { onBooks: () => void; onPosts: () => void; onLibrary: () => void; onReadingRooms: () => void }) {
    return (
        <nav className="hidden md:flex items-center gap-1">
            <SearchTrigger />
            <NavButton onClick={onBooks} icon={<BookOpen className="w-4 h-4" />}>Khám phá</NavButton>
            <NavButton onClick={onPosts} icon={<Globe className="w-4 h-4" />}>Bảng tin</NavButton>
            <NavButton onClick={onLibrary} icon={<Library className="w-4 h-4" />}>Thư viện</NavButton>
            <NavButton onClick={onReadingRooms} icon={<Users className="w-4 h-4" />}>Phòng đọc</NavButton>
        </nav>
    );
}

function NavButton({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Button variant="ghost" onClick={onClick} className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full font-medium px-4">
            {icon}
            {children}
        </Button>
    );
}

function ColorThemeToggle({ mounted, colorTheme, onToggle }: { mounted: boolean; colorTheme: 'mono' | 'red' | 'blue'; onToggle: () => void }) {
    let titleText = "Chọn màu chủ đề";
    if (mounted) {
        if (colorTheme === 'mono') titleText = "Chuyển sang tông Đỏ";
        else if (colorTheme === 'red') titleText = "Chuyển sang tông Xanh";
        else if (colorTheme === 'blue') titleText = "Chuyển sang tông Đen Trắng";
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 h-9 w-9"
            title={titleText}
        >
            <Palette className="w-4 h-4 text-brand" />
        </Button>
    );
}

function ThemeToggle({ mounted, theme, onToggle }: { mounted: boolean; theme: string | undefined; onToggle: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 h-9 w-9"
            title="Đổi giao diện"
        >
            {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
    );
}

interface UserDropdownProps {
    user: { id: string; email?: string | null; image?: string | null; role?: string };
    avatarUrl?: string;
    onProfile: () => void;
    onLibrary: () => void;
    onKnowledgeMap: () => void;
    onLogout: () => void;
}


function UserDropdown({ user, avatarUrl, onProfile, onLibrary, onKnowledgeMap, onLogout }: UserDropdownProps) {
    const userName = user.email?.split('@')[0] || 'User';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full px-0 hover:bg-transparent border border-border shadow-sm p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                    <UserAvatar
                        src={avatarUrl}
                        name={userName}
                        className="h-full w-full rounded-full"
                        fallbackClassName="bg-primary/5 text-primary text-[10px] font-black"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="p-3 font-normal">
                    <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-bold leading-none text-foreground">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-1" />
                <div className="space-y-1 py-1">
                    <DropdownMenuItem onClick={onProfile} className="cursor-pointer gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Hồ sơ của tôi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onLibrary} className="cursor-pointer gap-2">
                        <Library className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Thư viện</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onKnowledgeMap} className="cursor-pointer gap-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Bản đồ tri thức</span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/5">
                    <LogOut className="h-4 w-4" />
                    <span className="font-bold text-sm">Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface MobileMenuProps {
    user: { id: string; email?: string | null; image?: string | null; role?: string };
    avatarUrl?: string;
    onProfile: () => void;
    onBooks: () => void;
    onPosts: () => void;
    onLibrary: () => void;
    onReadingRooms: () => void;
    onKnowledgeMap: () => void;
    onLogout: () => void;
}


function MobileMenu({ user, avatarUrl, onProfile, onBooks, onPosts, onLibrary, onReadingRooms, onKnowledgeMap, onLogout }: MobileMenuProps) {
    const userName = user.email?.split('@')[0] || 'User';

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-accent/50">
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[350px] p-0 border-l border-border bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-accent/30 border border-border">
                        <UserAvatar
                            src={avatarUrl}
                            name={userName}
                            className="h-14 w-14 border-2 border-background shadow-md text-lg"
                            fallbackClassName="bg-primary text-primary-foreground font-black"
                        />
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-lg truncate text-foreground">{userName}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 mb-2">Cá nhân</p>
                        <MobileNavItem onClick={onProfile} icon={<User className="w-5 h-5" />}>Hồ sơ cá nhân</MobileNavItem>
                        <MobileNavItem onClick={onLibrary} icon={<Library className="w-5 h-5" />}>Thư viện của tôi</MobileNavItem>

                        <div className="h-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 mb-2">Khám phá</p>
                        <MobileNavItem onClick={onBooks} icon={<Search className="w-5 h-5" />}>Tìm kiếm</MobileNavItem>
                        <MobileNavItem onClick={onPosts} icon={<Globe className="w-5 h-5" />}>Bảng tin cộng đồng</MobileNavItem>
                        <MobileNavItem onClick={onReadingRooms} icon={<Users className="w-5 h-5" />}>Phòng đọc chung</MobileNavItem>
                        <MobileNavItem onClick={onKnowledgeMap} icon={<Network className="w-5 h-5" />}>Bản đồ tri thức</MobileNavItem>
                    </div>


                    <div className="mt-auto pt-6 border-t border-border">
                        <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/5 font-bold transition-all" onClick={onLogout}>
                            <LogOut className="w-5 h-5" />
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function MobileNavItem({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl font-semibold hover:bg-accent/50 transition-all px-4" onClick={onClick}>
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {icon}
            </div>
            {children}
        </Button>
    );
}

