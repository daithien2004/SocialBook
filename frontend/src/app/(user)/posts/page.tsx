'use client';

import { useState } from 'react';
import PostList from '@/src/components/post/PostList';
import CreatePostForm from '@/src/components/post/CreatePostForm';
import { useSession } from 'next-auth/react';
// import { useSession } from "next-auth/react"; // Uncomment khi có auth

export default function Post() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  return (
    <div className="mt-4 flex justify-center gap-4">
      {/* Sidebar trái */}
      <div className="hidden lg:block w-1/5 bg-gray-50 rounded-2xl p-4 m-4 shadow-sm h-fit sticky top-20">
        <h2 className="font-semibold mb-3">Menu</h2>
        <ul className="space-y-2 text-sm">
          <li className="hover:text-blue-600 cursor-pointer">Trang chủ</li>
          <li className="hover:text-blue-600 cursor-pointer">Bạn bè</li>
          <li className="hover:text-blue-600 cursor-pointer">Nhóm đọc</li>
          <li className="hover:text-blue-600 cursor-pointer">Thư viện</li>
        </ul>
      </div>

      {/* Main content */}
      <div className="w-full lg:w-2/5 bg-white p-4">
        {/* Create Post Box */}
        <div className="bg-white rounded-xl shadow p-4 space-y-4 mb-4 border-1 border-neutral-200">
          <div className="flex items-center space-x-3">
            <img
              src="/abstract-book-pattern.png"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Vinh</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-xs text-gray-500 hover:text-blue-600 text-left w-full"
              >
                Đang nghĩ gì?
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-t pt-3">
            <div className="flex space-x-4 text-sm text-gray-600">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-1 hover:text-blue-600"
              >
                <span>📷</span>
                <span>Ảnh</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-1 hover:text-blue-600"
              >
                <span>💬</span>
                <span>Trích dẫn</span>
              </button>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Đăng
            </button>
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreateForm && (
          <CreatePostForm onClose={() => setShowCreateForm(false)} />
        )}

        {/* Post List */}
        <div className="mt-4">
          <PostList currentUserId={currentUserId} />
        </div>
      </div>

      {/* Sidebar phải */}
      <div className="hidden lg:block w-1/5 bg-gray-50 rounded-2xl p-4 m-4 shadow-sm h-fit sticky top-20">
        <h2 className="font-semibold mb-3">Đề xuất</h2>
        <ul className="space-y-2 text-sm">
          <li className="hover:text-blue-600 cursor-pointer">
            Tác giả nổi bật
          </li>
          <li className="hover:text-blue-600 cursor-pointer">Bài viết hay</li>
          <li className="hover:text-blue-600 cursor-pointer">Nhóm nổi bật</li>
        </ul>
      </div>
    </div>
  );
}
