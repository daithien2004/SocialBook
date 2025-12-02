'use client';

import { useState } from 'react';
import PostList from '@/src/components/post/PostList';
import CreatePostForm from '@/src/components/post/CreatePostForm';
import { useSession } from 'next-auth/react';
import { BookOpen, Users, Library, Quote, ImageIcon, PenSquare } from 'lucide-react';

export default function Post() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserName = session?.user?.name || 'Người đọc';
  const currentUserImage = (session?.user as any)?.image || '/abstract-book-pattern.png';

  return (
      <div className="min-h-screen bg-slate-50">
        {/* HEADER BAR */}
        <header className="border-b border-slate-100  backdrop-blur">
        </header>

        {/* MAIN LAYOUT */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 flex justify-center gap-4">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block w-[22%]">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                      src={currentUserImage}
                      alt={currentUserName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {currentUserName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Hôm nay bạn đang đọc gì?
                    </p>
                  </div>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 py-2 transition-colors"
                >
                  <PenSquare size={14} />
                  <span>Viết bài mới</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Điều hướng
                </h2>
                <nav className="space-y-2 text-sm text-slate-700">
                  <button className="flex items-center gap-2 w-full text-left hover:text-sky-600">
                    <BookOpen size={16} />
                    <span>Trang chủ</span>
                  </button>
                  <button className="flex items-center gap-2 w-full text-left hover:text-sky-600">
                    <Users size={16} />
                    <span>Bạn bè & theo dõi</span>
                  </button>
                  <button className="flex items-center gap-2 w-full text-left hover:text-sky-600">
                    <Quote size={16} />
                    <span>Trích dẫn yêu thích</span>
                  </button>
                  <button className="flex items-center gap-2 w-full text-left hover:text-sky-600">
                    <Library size={16} />
                    <span>Thư viện cá nhân</span>
                  </button>
                </nav>
              </div>
            </div>
          </aside>

          {/* FEED */}
          <section className="w-full lg:w-[56%]">
            {/* CREATE POST BOX */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                    src={currentUserImage}
                    alt={currentUserName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex-1 text-left text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-full px-4 py-2 transition-colors"
                >
                  {currentUserName}, bạn đang nghĩ gì về cuốn sách hôm nay?
                </button>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div className="flex gap-4 text-xs text-slate-600">
                  <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-1.5 hover:text-sky-600"
                  >
                    <ImageIcon size={16} />
                    <span>Ảnh</span>
                  </button>
                  <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-1.5 hover:text-sky-600"
                  >
                    <Quote size={16} />
                    <span>Trích dẫn</span>
                  </button>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition-colors"
                >
                  <PenSquare size={14} />
                  <span>Đăng bài</span>
                </button>
              </div>
            </div>

            {/* CREATE POST MODAL */}
            {showCreateForm && (
                <CreatePostForm onClose={() => setShowCreateForm(false)} />
            )}

            {/* POST LIST */}
            <PostList currentUserId={currentUserId} />
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden lg:block w-[22%]">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Gợi ý cho bạn
                </h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center justify-between hover:text-sky-600 cursor-pointer">
                    <span>Tác giả nổi bật</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Khám phá
                  </span>
                  </li>
                  <li className="flex items-center justify-between hover:text-sky-600 cursor-pointer">
                    <span>Bài viết hay gần đây</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </li>
                  <li className="flex items-center justify-between hover:text-sky-600 cursor-pointer">
                    <span>Nhóm đọc nổi bật</span>
                    <span className="text-[10px] text-slate-400">Mới</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Hoạt động đọc
                </h2>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Ngày đọc liên tục</span>
                    <span className="font-medium text-slate-900">3 ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số sách đang đọc</span>
                    <span className="font-medium text-slate-900">2 cuốn</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bài viết trong tuần</span>
                    <span className="font-medium text-slate-900">5 bài</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
  );
}
