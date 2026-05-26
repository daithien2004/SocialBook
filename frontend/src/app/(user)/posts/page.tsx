'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback } from 'react';
import PostList from '@/components/post/PostList';
import { useAppAuth } from '@/features/auth/hooks';
import { PenSquare } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useModalStore } from '@/store/useModalStore';
import TrendingBooksWidget from '@/components/post/TrendingBooksWidget';
import TopActiveReadersWidget from '@/components/post/TopActiveReadersWidget';
import LoginWall from '@/components/auth/LoginWall';

import { AppLoading } from '@/components/common/AppLoading';

const UserSearchSidebar = dynamic(
    () => import('@/components/post/UserSearchSidebar'),
    {
        ssr: false,
        loading: () => (
            <div className="h-40 rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900" />
        ),
    }
);

const RecommendedBooks = dynamic(
    () => import('@/components/post/RecommendedBooks'),
    {
        ssr: false,
        loading: () => (
            <div className="h-56 rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900" />
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

    const goToFollowing = useCallback(() => {
        if (currentUserId) {
            router.push(`/users/${currentUserId}/following`);
        }
    }, [router, currentUserId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950">
                <AppLoading size={32} text="Đang tải..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <LoginWall
                title="Dòng sự kiện"
                description="Đăng nhập để đọc và đăng bài chia sẻ về những cuốn sách bạn yêu thích với cộng đồng."
                secondaryLabel="Khám phá sách trước"
                secondaryHref="/books"
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-neutral-950">

            {/* HEADER */}
            <header className="border-b border-border backdrop-blur"></header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 flex justify-center gap-4 pb-4">

                {/* LEFT SIDEBAR */}
                <aside className="hidden lg:block w-[22%]">
                    <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto thin-scrollbar pr-1">

                        {/* USER BOX */}
                        <div
                            onClick={goToFollowing}
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-border p-4 cursor-pointer">

                            <div className="flex items-center gap-3 mb-3">
                                <Image
                                    src={currentUserImage}
                                    alt={currentUserName}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-gray-700"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-foreground truncate">{currentUserName}</p>
                                    <p className="text-xs text-muted-foreground">Hôm nay bạn đang đọc
                                        gì?</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCreatePost();
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-slate-50 dark:bg-zinc-800 text-xs font-medium text-foreground py-2 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                            >
                                <PenSquare size={14} />
                                <span>Viết bài mới</span>
                            </button>
                        </div>

                        <UserSearchSidebar />
                        {/* WIDGETS */}
                        <TrendingBooksWidget />
                        <TopActiveReadersWidget />
                    </div>
                </aside>

                {/* FEED AREA */}
                <section className="w-full lg:w-[56%]">

                    {/* CREATE POST BOX */}
                    <div
                        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-border p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Image
                                src={currentUserImage}
                                alt={currentUserName}
                                width={36}
                                height={36}
                                onClick={() => {
                                    router.push(`/users/${currentUserId}`)
                                }}
                                className="h-9 w-9 cursor-pointer rounded-full border border-slate-200 object-cover dark:border-gray-700"
                            />
                            <button
                                onClick={() => openCreatePost()}
                                className="flex-1 text-left text-sm text-muted-foreground bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full px-4 py-2 transition"
                            >
                                {currentUserName}, bạn đang nghĩ gì về cuốn sách hôm nay?
                            </button>
                        </div>

                        <div
                            className="flex justify-between items-center border-t border-border pt-3">
                            <button
                                onClick={() => openCreatePost()}
                                className="inline-flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700"
                            >
                                <PenSquare size={14} />
                                <span>Đăng bài</span>
                            </button>
                        </div>
                    </div>

                    <PostList />
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="hidden lg:block w-[22%]">
                    <div className="sticky top-20 space-y-4">
                        <RecommendedBooks />
                    </div>
                </aside>
            </main>
        </div>
    );
}
