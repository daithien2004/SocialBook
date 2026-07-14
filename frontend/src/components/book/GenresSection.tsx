'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from '@/features/books/types/book.interface';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

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
    <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
      {/* Top accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />

      {/* Header */}
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
          Thể loại nổi bật
        </CardTitle>
        <Link 
          href="/books" 
          className="text-muted-foreground hover:text-brand transition-colors group flex items-center"
          title="Xem tất cả"
        >
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-300" />
        </Link>
      </CardHeader>

      <CardContent>
        {/* Genres Grid */}
        <div className="flex flex-nowrap xl:flex-wrap gap-2 pt-1 pb-2 xl:pb-0 overflow-x-auto xl:overflow-visible scrollbar-hide">
          {genresWithCount.map((genre) => (
            <button
              key={genre.slug}
              onClick={() => handleGenreClick(genre.slug)}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-brand/[0.03] dark:hover:bg-brand/[0.02] hover:text-brand hover:border-brand/30 border border-border/70 text-xs font-semibold text-foreground/80 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer shadow-sm flex-shrink-0 whitespace-nowrap"
            >
              {genre.name}
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-muted text-[9px] text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand font-bold transition-all">
                {genre.count}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
