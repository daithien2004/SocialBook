'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';
import { useGetTrendingSearchesQuery } from '@/features/books/api/bookApi';
import { useRouter } from 'next/navigation';

export const TrendingKeywordsSection = () => {
  const router = useRouter();
  const { data: trendingSearches = [], isLoading } = useGetTrendingSearchesQuery();

  if (isLoading || !trendingSearches || trendingSearches.length === 0) {
    return null; // Do not render if loading or no data
  }

  const handleKeywordClick = (keyword: string) => {
    router.push(`/books?search=${encodeURIComponent(keyword)}`);
  };

  return (
    <section className="mb-8">
      <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
            Từ khóa phổ biến
          </CardTitle>
          <Flame size={16} className="text-brand" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((keyword, index) => (
              <button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  index < 3
                    ? 'bg-brand/10 text-brand border-brand/20 hover:bg-brand hover:text-white'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                }`}
              >
                <TrendingUp size={12} className={index < 3 ? 'text-current opacity-80' : 'text-muted-foreground'} />
                {keyword}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
