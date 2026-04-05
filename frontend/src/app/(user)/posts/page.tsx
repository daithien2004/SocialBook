'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import {useState} from 'react';
import PostList from '@/components/post/PostList';
import { useAppAuth } from '@/features/auth/hooks';
import {BookOpen, Users, Library, Quote, ImageIcon, PenSquare} from 'lucide-react';
import {useRouter} from "next/navigation";
import { useModalStore } from '@/store/useModalStore';

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
    const {user} = useAppAuth();
    const currentUserId = user?.id;
    const route = useRouter();
    const currentUserName = user?.name || 'Người đọc';
    const currentUserImage = user?.image || '/abstract-book-pattern.png';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-neutral-950">

            {/* HEADER */}
            <header className="border-b border-slate-100 dark:border-gray-800 backdrop-blur"></header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 flex justify-center gap-4 pb-4">

                {/* LEFT SIDEBAR */}
                <aside className="hidden lg:block w-[22%]">
                    <div className="sticky top-20 space-y-4">

                        {/* USER BOX */}
                        <div
                            onClick={() => {
                                route.push(`users/${currentUserId}/following`)
                            }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-4 cursor-pointer">

                            <div className="flex items-center gap-3 mb-3">
                                <Image
                                    src={currentUserImage}
                                    alt={currentUserName}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-gray-700"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">{currentUserName}</p>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">Hôm nay bạn đang đọc
                                        gì?</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCreatePost();
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-gray-300 py-2 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                            >
                                <PenSquare size={14}/>
                                <span>Viết bài mới</span>
                            </button>
                        </div>

                        <UserSearchSidebar/>
                        {/* NAVIGATION */}
                        <div
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-4">
                            <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                Điều hướng
                            </h2>

                            <nav className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
                                <button
                                    className="flex items-center gap-2 w-full text-left hover:text-sky-600 dark:hover:text-sky-400">
                                    <BookOpen size={16}/>
                                    <span onClick={() => route.push(`/`)}
                                    >Trang chủ</span>
                                </button>

                                {
                                    currentUserId && (
                                        <button
                                            className="flex items-center gap-2 w-full text-left hover:text-sky-600 dark:hover:text-sky-400">
                                            <Users size={16}/>
                                            <span onClick={() => route.push(`users/${currentUserId}/following`)}>Bạn bè & theo dõi</span>
                                        </button>
                                    )
                                }

                                <button
                                    className="flex items-center gap-2 w-full text-left hover:text-sky-600 dark:hover:text-sky-400">
                                    <Library size={16}/>
                                    <span
                                        onClick={() => route.push(`/library`)}
                                    >Thư viện cá nhân</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* FEED AREA */}
                <section className="w-full lg:w-[56%]">

                    {/* CREATE POST BOX */}
                    <div
                        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Image
                                src={currentUserImage}
                                alt={currentUserName}
                                width={36}
                                height={36}
                                onClick={() => {
                                    route.push(`users/${currentUserId}/following`)
                                }}
                                className="h-9 w-9 cursor-pointer rounded-full border border-slate-200 object-cover dark:border-gray-700"
                            />
                            <button
                                onClick={() => openCreatePost()}
                                className="flex-1 text-left text-sm text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full px-4 py-2 transition"
                            >
                                {currentUserName}, bạn đang nghĩ gì về cuốn sách hôm nay?
                            </button>
                        </div>

                        <div
                            className="flex justify-between items-center border-t border-slate-100 dark:border-gray-800 pt-3">
                            <div className="flex gap-4 text-xs text-slate-600 dark:text-gray-400">
                                <button
                                    onClick={() => openCreatePost()}
                                    className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400"
                                >
                                    <ImageIcon size={16}/>
                                    <span>Ảnh</span>
                                </button>

                                <button
                                    onClick={() => openCreatePost()}
                                    className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400"
                                >
                                    <Quote size={16}/>
                                    <span>Trích dẫn</span>
                                </button>
                            </div>

                            <button
                                onClick={() => openCreatePost()}
                                className="inline-flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700"
                            >
                                <PenSquare size={14}/>
                                <span>Đăng bài</span>
                            </button>
                        </div>
                    </div>

                    <PostList />
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="hidden lg:block w-[22%]">
                    <div className="sticky top-20 space-y-4">
                        <RecommendedBooks/>
                    </div>
                </aside>
            </main>
        </div>
    );
}
