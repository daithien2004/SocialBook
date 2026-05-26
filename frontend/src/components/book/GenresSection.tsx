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
    <Card className="bg-transparent border border-border/50 shadow-none">
      {/* Header */}
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">
          Thể loại
        </CardTitle>
        <Link href="/books" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowRight size={16} />
        </Link>
      </CardHeader>

      <CardContent>
        {/* Genres Grid */}
        <div className="flex flex-wrap gap-2">
          {genresWithCount.map((genre) => (
            <button
              key={genre.slug}
              onClick={() => handleGenreClick(genre.slug)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/50 text-xs font-medium text-foreground/80 transition-all cursor-pointer"
            >
              {genre.name}
              <span className="text-[10px] text-muted-foreground font-semibold">
                {genre.count}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
