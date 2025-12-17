'use client';

import { useEffect, useState } from 'react';
import { useGetBooksQuery } from '../features/books/api/bookApi';
import { TabType, TABS, PAGINATION } from '../features/books/books.constants';
import { shouldLoadMore } from '../features/books/books.utils';
import { useInfiniteScroll } from '../features/books/hooks/useInfiniteScroll';
import { useTabsManager } from '../features/books/hooks/useTabsManager';
import { BookOrderField } from '../features/books/types/book.interface';
import { BannerSlider } from './book/BannerSlider';
import { BookGrid } from './book/BookGrid';
import { GenresSection } from './book/GenresSection';
import { MobileReadingSection } from './book/MobileReadingSection';
import { ReadingSidebar } from './book/ReadingSidebar';
import { RecommendedForYouSection } from './book/RecommendedForYouSection';
import { TabNavigation } from './book/TabNavigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('trending');

  const currentTabConfig = TABS.find((t) => t.id === activeTab)!;

  const { currentState, loadMoreBooks, setFetchedData } = useTabsManager({
    activeTab,
  });

  const { data, isLoading, isFetching } = useGetBooksQuery({
    page: currentState.page,
    limit: PAGINATION.BOOKS_PER_PAGE,
    sortBy: currentTabConfig.sortBy as BookOrderField,
  });

  useEffect(() => {
    if (data) {
      setFetchedData(data);
    }
  }, [data, setFetchedData]);

  const lastBookRef = useInfiniteScroll({
    onLoadMore: loadMoreBooks,
    isEnabled: shouldLoadMore(isFetching, currentState.hasMore),
  });

  const featuredBooks = currentState.books.slice(
    0,
    PAGINATION.FEATURED_BOOKS_COUNT
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
      <PageBackground />

      <div className="relative z-10">
        <main>
          <div className="pb-8">
            <BannerSlider books={featuredBooks} />
          </div>

          <MobileReadingSection />

          <div className="max-w-[1920px] mx-auto px-4 xl:px-8 flex gap-8">
            <aside className="hidden xl:block xl:w-64 flex-shrink-0">
              <div className="top-20 space-y-6">
                <ReadingSidebar />
                <GenresSection books={currentState.books} />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              <BookGrid
                books={currentState.books}
                isLoading={isLoading}
                isFetching={isFetching}
                hasMore={currentState.hasMore}
                isInitialized={currentState.isInitialized}
                onLastElementVisible={lastBookRef}
              />
            </div>

            <aside className="hidden xl:block xl:w-80 flex-shrink-0">
              <div className="top-20">
                <RecommendedForYouSection />
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
      <img
        src="/main-background.jpg"
        alt="Background Texture"
        className="w-full h-full object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300" />
    </div>
  );
}
