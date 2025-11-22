'use client'; // Quan trọng: Phải có use client vì dùng useState

import { useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import { Eye, Heart, Star, Bookmark } from 'lucide-react'; // Import Bookmark
import Link from 'next/link';
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal'; // Import Modal

export function BookCard({ book }: { book: Book }) {
  // --- STATE CHO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- LOGIC GIỮ NGUYÊN ---
  const isNew = () => {
    const bookDate = new Date(book.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - bookDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const isTrending = book.views > 2000;

  const rating =
    book.views > 0 ? ((book.likes / book.views) * 5).toFixed(1) : '0.0';

  const ratingNum = parseFloat(rating);

  // Helper format số
  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  // Handle click nút thêm thư viện
  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.preventDefault(); // Chặn chuyển trang của thẻ Link
    e.stopPropagation();
    setIsModalOpen(true);
  };
  // ------------------------

  return (
    <>
      <Link href={`/books/${book.slug}`} className="group block relative">
        <div className="flex flex-col gap-3">
          {/* 1. IMAGE SECTION */}
          <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden rounded-sm">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* --- NÚT THÊM VÀO THƯ VIỆN (MỚI) --- */}
            <button
              onClick={handleAddToLibrary}
              title="Thêm vào thư viện"
              className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-600 hover:text-blue-600 hover:bg-white transition-all opacity-0 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0 duration-300 z-10"
            >
              <Bookmark size={18} />
            </button>
            {/* ---------------------------------- */}

            {/* Badges (Giữ nguyên) */}
            <div className="absolute top-4 right-0 flex flex-col items-end gap-1">
              {isNew() && (
                <span className="bg-[#0f5132] text-white text-xs font-medium px-3 py-1 shadow-sm">
                  New
                </span>
              )}
              {isTrending && (
                <span className="bg-red-600 text-white text-xs font-medium px-3 py-1 shadow-sm">
                  Hot
                </span>
              )}
              {book.status === 'completed' && (
                <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 shadow-sm">
                  Full
                </span>
              )}
            </div>
          </div>

          {/* 2. INFO SECTION (Giữ nguyên) */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-1">
              {book.title}
            </h3>

            <p className="text-sm text-gray-500 mt-1 mb-3 line-clamp-1">
              {book.authorId.name}
            </p>

            <div className="flex flex-wrap gap-2 mb-3 opacity-60 text-[10px] uppercase tracking-wide text-gray-500">
              {book.genres
                .slice(0, 2)
                .map((g) => g.name)
                .join(' • ')}
            </div>

            {/* 3. BOTTOM ROW (Giữ nguyên) */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                <span className="text-orange-600 font-bold text-lg flex items-center gap-1">
                  {ratingNum > 0 ? rating : 'N/A'}
                  <Star size={12} className="fill-orange-600" />
                </span>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                  <span className="flex items-center gap-0.5">
                    <Eye size={10} /> {formatNumber(book.views)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart size={10} /> {formatNumber(book.likes)}
                  </span>
                </div>
              </div>

              <button className="px-6 py-1.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 group-hover:border-gray-900 group-hover:text-gray-900 transition-all">
                Read
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* --- RENDER MODAL (MỚI) --- */}
      {/* Đặt Modal ngoài thẻ Link để tránh lỗi Hydration hoặc lồng thẻ a */}
      <AddToLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookId={book.id}
      />
    </>
  );
}
