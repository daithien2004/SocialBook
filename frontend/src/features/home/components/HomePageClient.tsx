'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { bookQueries } from '@/features/books/api/books.queries';
import { TabType, TABS, PAGINATION } from '@/features/books/books.constants';
import { shouldLoadMore } from '@/features/books/books.utils';
import { useInfiniteScroll } from '@/features/books/hooks/useInfiniteScroll';
import { BookOrderField } from '@/features/books/types/book.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { libraryQueries } from '@/features/library/api/library.queries';
import { LibraryItem, LibraryStatus } from '@/features/library/types/library.interface';
import { BannerSlider } from '@/features/books/components/BannerSlider';
import { BookGrid } from '@/features/books/components/BookGrid';
import { GenresSection } from '@/features/books/components/GenresSection';
import { MobileReadingSection } from '@/features/books/components/MobileReadingSection';
import { ReadingSidebar } from '@/features/books/components/ReadingSidebar';
import { RecommendedForYouSection } from '@/features/books/components/RecommendedForYouSection';
import { TopReadSection } from '@/features/books/components/TopReadSection';
import { TrendingKeywordsSection } from '@/features/books/components/TrendingKeywordsSection';
import { TabNavigation } from '@/features/books/components/TabNavigation';

const EMPTY_BOOKS: LibraryItem[] = [];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('trending');

  const { isAuthenticated, isGuest } = useAppAuth();
  const { data: readingBooks = EMPTY_BOOKS, isLoading: isReadingLoading } = useQuery({
    ...libraryQueries.books({ status: LibraryStatus.READING, limit: 10 }),
    enabled: isAuthenticated,
  });

  const currentTabConfig = TABS.find((t) => t.id === activeTab)!;

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } = useInfiniteQuery(
    bookQueries.infiniteList({
      limit: PAGINATION.BOOKS_PER_PAGE,
      sortBy: currentTabConfig.sortBy as BookOrderField,
    }),
  );

  const books = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const lastBookRef = useInfiniteScroll({
    onLoadMore: () => {
      if (hasNextPage && !isFetching) {
        void fetchNextPage();
      }
    },
    isEnabled: shouldLoadMore(isFetching, !!hasNextPage),
  });

  const featuredBooks = useMemo(
    () => books.slice(0, PAGINATION.FEATURED_BOOKS_COUNT),
    [books],
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand selection:text-brand-foreground relative transition-colors duration-300">
      <PageBackground />

      <div className="relative z-10">
        <main>
          <div className="pb-8">
            <BannerSlider books={featuredBooks} />
          </div>

          <MobileReadingSection books={readingBooks} isLoading={isReadingLoading} isGuest={isGuest} />

          <div className="max-w-[1920px] mx-auto px-4 xl:px-8 flex gap-8">
            <aside className="hidden xl:block xl:w-64 flex-shrink-0">
              <div className="top-20 space-y-6">
                <ReadingSidebar books={readingBooks} isLoading={isReadingLoading} isGuest={isGuest} />
                <TrendingKeywordsSection />
                <GenresSection books={books} />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {/* Mobile sections */}
              <div className="xl:hidden flex flex-col gap-6 mb-8 mt-2">
                <TrendingKeywordsSection />
                <RecommendedForYouSection />
                <TopReadSection />
                <GenresSection books={books} />
              </div>

              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              <BookGrid
                books={books}
                isLoading={isLoading}
                isFetching={isFetching}
                hasMore={!!hasNextPage}
                isInitialized={!isLoading}
                onLastElementVisible={lastBookRef}
              />
            </div>

            <aside className="hidden xl:block xl:w-80 flex-shrink-0">
              <div className="top-20 space-y-6">
                <RecommendedForYouSection />
                <TopReadSection />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function PageBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <Image
        src="/main-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300" />
    </div>
  );
}
