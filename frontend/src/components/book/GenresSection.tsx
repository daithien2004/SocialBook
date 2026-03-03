'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from '@/features/books/types/book.interface';
import { ArrowRight, Tag } from 'lucide-react';
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
    <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
      {/* Header */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Tag className="text-red-600 dark:text-red-400" size={18} />
          Thể loại
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Genres Grid */}
        <div className="flex flex-wrap gap-2 mb-4">
          {genresWithCount.map((genre) => (
            <Button
              key={genre.slug}
              variant="outline"
              size="sm"
              onClick={() => handleGenreClick(genre.slug)}
              className="h-auto py-1.5 px-3 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all text-left"
            >
              <span className="mr-1.5">{genre.name}</span>
              <Badge variant="secondary" className="bg-muted text-[10px] px-1 h-4 flex items-center justify-center min-w-[1.25rem]">
                {genre.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* View All Link */}
        <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-red-600 dark:hover:text-red-400 group">
          <Link href="/books" className="flex items-center justify-center gap-1">
            Xem tất cả
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
