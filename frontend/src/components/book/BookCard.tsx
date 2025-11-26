'use client';

import { useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import {Star, ThumbsUp, Bookmark, Eye} from 'lucide-react';
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

  const rating =
      book.views > 0 ? ((book.likes / book.views) * 5).toFixed(1) : '0.0';

  const ratingNum = parseFloat(rating);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const isPremium = book.status === 'completed';

  return (
      <>
        <Link href={`/books/${book.slug}`} className="group block">
          <div className="flex flex-col min-w-[180px] max-w-[180px] pt-8">
            <div className="relative">
              {/* Book Cover - positioned to overlap the background card */}
              <div className="absolute -top-8 left-3 right-3 z-10">
                <div className="
                      relative aspect-[3/4] overflow-hidden
                      shadow-[0_4px_15px_rgba(0,0,0,0.18),0_0_10px_rgba(0,0,0,0.05)]
                      ring-1 ring-black/5
                      transition-all duration-300
                      group-hover:scale-[1.03] group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.25)]
                    ">
                  <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                  />

                  {/* Badges - Top Right */}
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {isPremium && (
                        <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                fill="currentColor"
                            />
                          </svg>
                          Full
                        </div>
                    )}
                    {isNew() && (
                        <span className="bg-[#0f5132] text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                      New
                    </span>
                    )}
                    {isTrending && (
                        <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                      Hot
                    </span>
                    )}
                  </div>

                  {/* Add to Library Button - appears on hover */}
                  <button
                      onClick={handleAddToLibrary}
                      title="Thêm vào thư viện"
                      className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-gray-600 hover:text-[#6A4E5A] transition-all opacity-0 group-hover:opacity-100 z-20"
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>

              {/* Background Card */}
              <div className="bg-[#f5efe6] rounded-t-xl pt-[50px] mt-32 pb-4 px-3 transition-shadow duration-300 group-hover:shadow-md">
                {/* Book Info */}
                <div className="mt-3">
                  {/* Genre Tag */}
                  <div className="mb-2">
                  <span className="inline-block bg-[#FAE3C6] text-[#5A3A2A] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {book.genres.length > 0 ? book.genres[0].name : 'Book'}
                  </span>
                  </div>

                  {/* Author */}
                  <p className="text-[#888888] font-sans text-xs mb-1 truncate">{book.authorId.name}</p>

                  {/* Title */}
                  <h3 className="text-[#333333] font-sans text-sm font-semibold leading-tight mb-2 line-clamp-2 min-h-[40px] group-hover:text-[#6A4E5A] transition-colors">
                    {book.title}
                  </h3>

                  {/* Views and Likes */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-[#555555] font-medium">
                      {formatNumber(book.views)}
                    </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-[#888888]" />
                      <span className="text-[#555555]">{formatNumber(book.likes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Modal - Outside Link to avoid nesting issues */}
        <AddToLibraryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            bookId={book.id}
        />
      </>
  );
}