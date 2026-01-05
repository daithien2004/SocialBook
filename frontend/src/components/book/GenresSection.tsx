'use client';

import { useRouter } from 'next/navigation';
import { Book } from '@/src/features/books/types/book.interface';
import { useMemo } from 'react';
import { Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface GenresSectionProps {
  books: Book[];
}

export const GenresSection = ({ books }: GenresSectionProps) => {
  const router = useRouter();

  const genresWithCount = useMemo(() => {
    const genresMap = new Map<string, { name: string; count: number }>();

    books.forEach((book) => {
      if (book.genres && Array.isArray(book.genres)) {
        book.genres.forEach((genre) => {
          if (genre?.slug && genre?.name) {
            const existing = genresMap.get(genre.slug);
            if (existing) {
              existing.count += 1;
            } else {
              genresMap.set(genre.slug, { name: genre.name, count: 1 });
            }
          }
        });
      }
    });

    return Array.from(genresMap.entries())
      .map(([slug, { name, count }]) => ({ slug, name, count }))
      .sort((a, b) => b.count - a.count);
  }, [books]);

  const handleGenreClick = (genreSlug: string) => {
    router.push(`/books?genres=${encodeURIComponent(genreSlug)}`);
  };

  if (genresWithCount.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Tag className="text-red-600 dark:text-red-400" size={18} />
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">
          Thể loại
        </h2>
      </div>

      {/* Genres Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {genresWithCount.map((genre) => (
          <button
            key={genre.slug}
            onClick={() => handleGenreClick(genre.slug)}
            className="group relative px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-red-500 dark:hover:border-red-500 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                {genre.name}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex-shrink-0">
                {genre.count}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* View All Link */}
      <Link
        href="/books"
        className="flex items-center justify-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
      >
        Xem tất cả
        <ArrowRight
          size={14}
          className="group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </div>
  );
};
