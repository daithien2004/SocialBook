'use client';

import { useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import { Bookmark, Eye, BookOpenCheck } from 'lucide-react'; // Dùng ít icon hơn
import Link from 'next/link';
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';

export function BookCard({ book }: { book: Book }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formatter số cực gọn (12k)
  const formatCompact = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(num);
  };

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <Link
        href={`/books/${book.slug}`}
        className="group block w-full max-w-[200px]"
      >
        {/* Khung viền mỏng, sắc nét, không bo góc tròn ủm (Sharp & Clean) */}
        <div className="flex flex-col border border-gray-200 bg-white transition-colors duration-300 hover:border-gray-900">
          {/* 1. IMAGE AREA - Tỉ lệ chuẩn, Padding đều như khung tranh */}
          <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-gray-100 p-2">
            <div className="relative h-full w-full overflow-hidden bg-gray-100">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 saturate-[0.8] group-hover:saturate-100"
              />
              {/* Status Label - Nhỏ, gọn, chuyên nghiệp ở góc */}
              <div className="absolute top-0 right-0 bg-white/90 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-black border-l border-b border-gray-200">
                {book.status === 'published' ? 'PUB' : 'WIP'}
              </div>
            </div>
          </div>

          {/* 2. INFO AREA - Typography focused */}
          <div className="flex flex-col p-3">
            {/* Meta Row (Genre | Author) - Dùng đường kẻ dọc | để ngăn cách */}
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-400 font-medium">
              <span className="text-black">{book.genres?.[0]?.name}</span>
              <span className="h-2 w-[1px] bg-gray-300"></span>
              <span className="truncate">{book.authorId.name}</span>
            </div>

            {/* Title - Font Serif cho cảm giác báo chí/văn học */}
            <h3 className="mb-3 line-clamp-2 font-serif text-base font-bold leading-tight text-gray-900 group-hover:underline decoration-1 underline-offset-2">
              {book.title}
            </h3>

            {/* Tech Specs Footer - Grid thông số kỹ thuật */}
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2.5">
              {/* Left: Stats (Text only, no flashy icons) */}
              <div className="flex gap-3 text-[10px] font-mono text-gray-500">
                <span className="flex items-center gap-1">
                  VOL.{book.stats?.chapters || 1}
                </span>
                <span className="flex items-center gap-1">
                  {formatCompact(book.views)} READS
                </span>
              </div>

              {/* Right: Action Button (Minimal) */}
              <button
                onClick={handleAddToLibrary}
                className="text-gray-400 transition-colors hover:text-black"
                title="Save to Library"
              >
                <Bookmark size={16} fill={isModalOpen ? 'black' : 'none'} />
              </button>
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
