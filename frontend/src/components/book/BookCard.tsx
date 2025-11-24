'use client';

import { useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import { Eye, Bookmark, Feather, Clock } from 'lucide-react';
import Link from 'next/link';
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';

export function BookCard({ book }: { book: Book }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isNew = () => {
    const bookDate = new Date(book.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - bookDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const isTrending = book.views > 2000;

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  const publishYear = new Date(book.createdAt).getFullYear();

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <Link href={`/books/${book.slug}`} className="group block h-full">
        <div className="flex flex-col h-full bg-white overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
          {/* 1. TOP SECTION: ẢNH & RIBBON */}
          <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
            {/* Ribbon Năm Xuất Bản - Màu đồng bộ với Title */}
            <div className="absolute top-[12px] -left-[28px] w-[100px] transform -rotate-45 bg-[#6A4E5A] text-white text-xs font-bold py-1 text-center shadow-md z-20 pointer-events-none">
              {publishYear}
            </div>

            <div className="w-full h-full transition-transform duration-700 group-hover:scale-105">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>

            {/* Badges */}
            <div className="absolute top-4 right-0 flex flex-col items-end gap-1 z-10">
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

            <button
              onClick={handleAddToLibrary}
              title="Thêm vào thư viện"
              className="absolute bottom-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-600 hover:text-[#6A4E5A] hover:bg-white transition-all opacity-0 translate-y-[10px] group-hover:opacity-100 group-hover:translate-y-0 duration-300 z-20"
            >
              <Bookmark size={18} />
            </button>
          </div>

          {/* 2. BOTTOM SECTION: THÔNG TIN (Đã chỉnh font) */}
          <div className="flex flex-col p-5 flex-grow border-t border-gray-50">
            {/* Tag Thể loại */}
            <div className="mb-3">
              <span className="inline-block bg-[#FAE3C6] text-[#5A3A2A] text-[11px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                {book.genres.length > 0 ? book.genres[0].name : 'Book'}
              </span>
            </div>

            {/* --- [UPDATED] TITLE --- */}
            {/* Đổi sang font-sans (mặc định), màu #6A4E5A, in đậm */}
            <h3 className="text-lg font-bold text-[#6A4E5A] leading-tight mb-1 group-hover:text-[#8a6575] transition-colors line-clamp-2">
              {book.title}
            </h3>

            {/* --- [UPDATED] AUTHOR --- */}
            {/* Đổi sang màu đen/xám đậm, nét thường */}
            <p className="text-[15px] text-gray-900 font-normal mb-4 line-clamp-1">
              {book.authorId.name}
            </p>

            {/* Footer Info */}
            <div className="mt-auto pt-4 border-t border-dashed border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Published</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={14} className="text-gray-400" />
                <span>{formatNumber(book.views)} views</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <AddToLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookId={book.id}
      />
    </>
  );
}
