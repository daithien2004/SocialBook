'use client';

import {useState} from 'react';
import PostList from '@/src/components/post/PostList';
import CreatePostForm from '@/src/components/post/CreatePostForm';
import {useAppAuth} from '@/src/hooks/useAppAuth';
import {BookOpen, Users, Library, Quote, ImageIcon, PenSquare} from 'lucide-react';
import RecommendedBooks from "@/src/components/post/RecommendedBooks";
import {useRouter} from "next/navigation";
import UserSearchSidebar from "@/src/components/post/UserSearchSidebar";

export default function Post() {
    const [showCreateForm, setShowCreateForm] = useState(false);
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
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <img
                                    src={currentUserImage}
                                    alt={currentUserName}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-gray-700"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">{currentUserName}</p>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">Hôm nay bạn đang đọc
                                        gì?</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCreateForm(true)}
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

                                {/*<button className="flex items-center gap-2 w-full text-left hover:text-sky-600 dark:hover:text-sky-400">*/}
                                {/*  <Quote size={16} />*/}
                                {/*  <span>Trích dẫn yêu thích</span>*/}
                                {/*</button>*/}

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
                            <img
                                src={currentUserImage}
                                alt={currentUserName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-gray-700"
                            />
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="flex-1 text-left text-sm text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full px-4 py-2 transition"
                            >
                                {currentUserName}, bạn đang nghĩ gì về cuốn sách hôm nay?
                            </button>
                        </div>

                        <div
                            className="flex justify-between items-center border-t border-slate-100 dark:border-gray-800 pt-3">
                            <div className="flex gap-4 text-xs text-slate-600 dark:text-gray-400">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400"
                                >
                                    <ImageIcon size={16}/>
                                    <span>Ảnh</span>
                                </button>

                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400"
                                >
                                    <Quote size={16}/>
                                    <span>Trích dẫn</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700"
                            >
                                <PenSquare size={14}/>
                                <span>Đăng bài</span>
                            </button>
                        </div>
                    </div>

                    {showCreateForm && <CreatePostForm onClose={() => setShowCreateForm(false)}/>}

                    <PostList currentUserId={currentUserId}/>
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="hidden lg:block w-[22%]">
                    <div className="sticky top-20 space-y-4">
                        {/*<div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-4">*/}
                        {/*  <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">*/}
                        {/*    Gợi ý cho bạn*/}
                        {/*  </h2>*/}

                        {/*  <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-300">*/}
                        {/*    <li className="flex items-center justify-between hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer">*/}
                        {/*      <span>Tác giả nổi bật</span>*/}
                        {/*      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400">*/}
                        {/*      Khám phá*/}
                        {/*    </span>*/}
                        {/*    </li>*/}

                        {/*    <li className="flex items-center justify-between hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer">*/}
                        {/*      <span>Bài viết hay gần đây</span>*/}
                        {/*      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />*/}
                        {/*    </li>*/}

                        {/*    <li className="flex items-center justify-between hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer">*/}
                        {/*      <span>Nhóm đọc nổi bật</span>*/}
                        {/*      <span className="text-[10px] text-slate-400 dark:text-gray-500">Mới</span>*/}
                        {/*    </li>*/}
                        {/*  </ul>*/}
                        {/*</div>*/}

                        <RecommendedBooks/>
                    </div>
                </aside>
            </main>
        </div>
    );
}
