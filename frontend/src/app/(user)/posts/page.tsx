'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useRef, useEffect } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import { useRouter } from "next/navigation";
import { useModalStore } from '@/store/useModalStore';
import PostList from '@/components/post/PostList';
import TrendingBooksWidget from '@/components/post/TrendingBooksWidget';
import TopActiveReadersWidget from '@/components/post/TopActiveReadersWidget';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

import { AppLoading } from '@/components/common/AppLoading';

const UserSearchSidebar = dynamic(
    () => import('@/components/post/UserSearchSidebar'),
    {
        ssr: false,
        loading: () => (
            <div className="h-40 rounded-2xl border border-border bg-card shadow-sm" />
        ),
    }
);

const RecommendedBooks = dynamic(
    () => import('@/components/post/RecommendedBooks'),
    {
        ssr: false,
        loading: () => (
            <div className="h-56 rounded-2xl border border-border bg-card shadow-sm" />
        ),
    }
);

export default function Post() {
    const { openCreatePost } = useModalStore();
    const { user, isAuthenticated, isLoading } = useAppAuth();
    const currentUserId = user?.id;
    const router = useRouter();
    const currentUserName = user?.name || 'Người đọc';
    const currentUserImage = user?.image || '/abstract-book-pattern.png';
    const feedRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            feedRef.current = document.documentElement as HTMLDivElement;
        }
    }, []);

    const goToFollowing = useCallback(() => {
        if (currentUserId) {
            router.push(`/users/${currentUserId}/following`);
        }
    }, [router, currentUserId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <AppLoading size={32} text="Đang tải..." />
            </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100vh-4rem)] bg-background relative">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="/main-background.jpg"
                    alt="Background Texture"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover opacity-10 dark:opacity-40"
                />
                <div className="absolute inset-0 bg-white/80 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-center gap-4">

                {/* LEFT SIDEBAR */}
                <aside className="hidden lg:block w-[22%] sticky top-20 h-[calc(100vh-6rem)] self-start">
                    <div className="h-full space-y-4 overflow-y-auto thin-scrollbar pr-1">

                        <UserSearchSidebar />
                        {/* WIDGETS */}
                        <TrendingBooksWidget />
                        <TopActiveReadersWidget />
                    </div>
                </aside>

                {/* FEED AREA — scroll nguyên khối như FB, ẩn scrollbar */}
                <section className="w-full lg:w-[56%] h-fit">
                    <div className="min-h-0 space-y-4">

                        {/* CREATE POST BOX */}
                        {isAuthenticated && (
                            <div className="bg-card rounded-2xl shadow-md border border-border p-4">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={currentUserImage}
                                        alt={currentUserName}
                                        width={36}
                                        height={36}
                                        onClick={() => {
                                            router.push(`/users/${currentUserId}`)
                                        }}
                                        className="h-9 w-9 cursor-pointer rounded-full border border-slate-200 object-cover dark:border-gray-700 hover:opacity-80 transition"
                                    />
                                    <button
                                        onClick={() => openCreatePost()}
                                        className="flex-1 text-left text-sm text-muted-foreground bg-muted hover:bg-accent hover:shadow-inner rounded-full px-4 py-2.5 transition-all duration-200 cursor-text"
                                    >
                                        {currentUserName}, bạn đang nghĩ gì về cuốn sách hôm nay?
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MOBILE WIDGETS TRIGGER */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="secondary" className="w-full justify-center gap-2 rounded-2xl h-12 shadow-sm font-semibold border border-border">
                                        <Compass className="w-5 h-5 text-amber-500" />
                                        Khám phá sách & Độc giả nổi bật
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl border-t border-border bg-background flex flex-col p-0 z-50">
                                    <SheetTitle className="sr-only">Khám phá và gợi ý</SheetTitle>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <UserSearchSidebar />
                                        <TrendingBooksWidget />
                                        <TopActiveReadersWidget />
                                        <RecommendedBooks />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <PostList scrollRef={feedRef} />
                    </div>
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="hidden lg:block w-[22%] sticky top-20 h-[calc(100vh-6rem)] self-start">
                    <div className="h-full space-y-4">
                        <RecommendedBooks />
                    </div>
                </aside>
            </main>
        </div>
    );
}
