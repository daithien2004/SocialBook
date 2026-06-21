'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetTopReadBooksQuery } from '@/features/books/api/bookApi';
import { Flame, BookOpen, Calendar, Clock, BarChart2 } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type TimeRange = 'weekly' | 'monthly' | 'all';

export const TopReadSection = () => {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');

  const { data: displayedBooks = [], isLoading, error } = useGetTopReadBooksQuery({
    timeRange,
    limit: 5,
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
              Đọc nhiều nhất
            </CardTitle>
            <Flame size={16} className="text-brand" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3 p-2">
                  <div className="w-16 h-24 bg-black/10 dark:bg-white/10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 mt-2">
                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return null; // Silent fail if cannot load
  }

  return (
    <section className="mb-12">
      <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
            Đọc nhiều nhất
          </CardTitle>
          <Flame size={16} className="text-brand" />
        </CardHeader>
        
        {/* Tabs */}
        <div className="px-4 pb-2">
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('weekly')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                timeRange === 'weekly' 
                  ? 'bg-background text-brand shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Clock size={12} />
              Tuần
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                timeRange === 'monthly' 
                  ? 'bg-background text-brand shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Calendar size={12} />
              Tháng
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                timeRange === 'all' 
                  ? 'bg-background text-brand shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <BarChart2 size={12} />
              Tất cả
            </button>
          </div>
        </div>

        <CardContent className="pt-1">
          {displayedBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">
                Chưa có sách nào
              </h3>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayedBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="relative"
                  onMouseEnter={() => setHoveredId(book.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/books/${book.slug}`)}
                    className="flex gap-3 w-full h-auto text-left hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-all duration-200 group justify-start items-start"
                  >
                    {/* Rank Badge */}
                    <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold shadow-sm z-10 text-muted-foreground group-hover:text-brand group-hover:border-brand transition-colors">
                      {index + 1}
                    </div>

                    {/* Book Cover */}
                    <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow ml-1">
                      <SafeImage
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="64px"
                        priority={index < 3}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0 flex flex-col pt-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-brand transition-colors mb-1 break-words whitespace-normal text-left">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.authorId?.name || 'Unknown Author'}
                      </p>
                      <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <Flame size={12} className="text-brand/70" />
                        {book.stats?.views?.toLocaleString() || 0} lượt đọc
                      </div>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
