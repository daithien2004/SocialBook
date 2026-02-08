'use client';

import { Book } from '@/features/books/types/book.interface';
import { BookCard } from './BookCard';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface RecommendedBookCardProps {
  book: Book;
  matchScore: number;
  reason: string;
}

export const RecommendedBookCard = ({
  book,
  matchScore,
  reason,
}: RecommendedBookCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = reason.length > 100;

  return (
    <div className="group relative">
      <BookCard book={book} />

      <div className="absolute top-2 right-2 z-20 pointer-events-none">
        <div className="px-2 py-1 bg-red-600 dark:bg-red-500 text-white text-xs font-bold rounded shadow-lg">
          {matchScore}%
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex flex-col justify-end p-4 z-10">
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-500 font-bold text-sm">
              {matchScore}% phù hợp
            </span>
          </div>

          <p
            className={`text-white text-xs leading-relaxed ${
              !isExpanded && isLongText ? 'line-clamp-3' : ''
            }`}
          >
            {reason}
          </p>

          {isLongText && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium pointer-events-auto transition-colors"
            >
              {isExpanded ? (
                <>
                  Thu gọn <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Xem thêm <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
