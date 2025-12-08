'use client';

import { BannerSlider } from '../components/book/BannerSlider';
import { Flame, Sparkles, BookPlus, Star } from 'lucide-react';
import { useGetBooksQuery } from '../features/books/api/bookApi';
import { Book } from '../features/books/types/book.interface';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReadingSidebar } from '../components/book/ReadingSidebar';
import { MobileReadingSection } from '../components/book/MobileReadingSection';
import { GenresSection } from '../components/book/GenresSection';
import { BookCard } from '../components/book/BookCard';
import { BookOrderField } from '../features/books/api/bookApi';
import { RecommendedForYouSection } from '../components/book/RecommendedForYouSection';

type TabType = 'trending' | 'new' | 'topRated' | 'updated';

const TABS = [
  {
    id: 'trending' as TabType,
    label: 'Hot nhất',
    icon: Flame,
    sortBy: 'views',
  },
  {
    id: 'new' as TabType,
    label: 'Mới nhất',
    icon: BookPlus,
    sortBy: 'createdAt',
  },
  {
    id: 'topRated' as TabType,
    label: 'Đánh giá cao',
    icon: Star,
    sortBy: 'likes',
  },
  {
    id: 'updated' as TabType,
    label: 'Mới cập nhật',
    icon: Sparkles,
    sortBy: 'updatedAt',
  },
];

interface TabState {
  books: Book[];
  page: number;
  hasMore: boolean;
  isInitialized: boolean;
}

const initialTabState: TabState = {
  books: [],
  page: 1,
  hasMore: true,
  isInitialized: false,
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('trending');

  const [tabStates, setTabStates] = useState<Record<TabType, TabState>>({
    trending: { ...initialTabState },
    new: { ...initialTabState },
    topRated: { ...initialTabState },
    updated: { ...initialTabState },
  });

  const { data: session, status } = useSession();
  const router = useRouter();

  const currentTab = TABS.find((t) => t.id === activeTab);
  const currentState = tabStates[activeTab];

  const { data, isLoading, isFetching } = useGetBooksQuery({
    page: currentState.page,
    limit: 20,
    sortBy: currentTab?.sortBy as BookOrderField,
  });

  const newBooks = data?.data || [];
  const metaData = data?.metaData;

  useEffect(() => {
    if (newBooks.length > 0 && metaData) {
      setTabStates((prev) => {
        const current = prev[activeTab];

        if (current.page === 1) {
          return {
            ...prev,
            [activeTab]: {
              books: newBooks,
              page: 1,
              hasMore: metaData.page < metaData.totalPages,
              isInitialized: true,
            },
          };
        }

        const uniqueBooks = newBooks.filter(
          (book) => !current.books.some((b) => b.id === book.id)
        );

        return {
          ...prev,
          [activeTab]: {
            ...current,
            books: [...current.books, ...uniqueBooks],
            hasMore: metaData.page < metaData.totalPages,
            isInitialized: true,
          },
        };
      });
    } else if (!isLoading && !isFetching && currentState.page > 1) {
      setTabStates((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          hasMore: false,
        },
      }));
    }
  }, [newBooks, activeTab, isLoading, isFetching, currentState.page, metaData]);

  const lastBookRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching || !currentState.hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setTabStates((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                page: prev[activeTab].page + 1,
              },
            }));
          }
        },
        { rootMargin: '200px' }
      );

      if (node) observer.observe(node);

      return () => observer.disconnect();
    },
    [isFetching, currentState.hasMore, activeTab]
  );

  const featuredBooks = currentState.books.slice(0, 5);

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user?.role === 'admin' &&
      window.location.pathname === '/'
    ) {
      router.push('/admin');
    }
  }, [status, session, router]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  if (isLoading && !currentState.isInitialized) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#141414] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
      <div className="fixed inset-0 z-0">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      <div className="relative z-10">
        <main>
          <div className="pb-8">
            <BannerSlider books={featuredBooks} />
          </div>

          <MobileReadingSection />

          <div className="max-w-[1920px] mx-auto px-4 xl:px-8">
            <RecommendedForYouSection />
          </div>

          <div className="max-w-[1920px] mx-auto px-4 xl:px-8 flex gap-8">
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto mb-8 mt-4 border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'text-red-600 dark:text-red-500 border-b-2 border-red-600 dark:border-red-500'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
                {currentState.books.map((book, index) => {
                  if (index === currentState.books.length - 1) {
                    return (
                      <div key={book.id} ref={lastBookRef}>
                        <BookCard book={book} />
                      </div>
                    );
                  }
                  return <BookCard key={book.id} book={book} />;
                })}
              </div>

              {isFetching && currentState.isInitialized && (
                <div className="flex justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent"></div>
                    <span>Đang tải thêm sách...</span>
                  </div>
                </div>
              )}

              {!currentState.hasMore && currentState.books.length > 0 && (
                <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Đã hiển thị tất cả sách</p>
                </div>
              )}

              {!isLoading &&
                currentState.isInitialized &&
                currentState.books.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">Không tìm thấy sách nào</p>
                  </div>
                )}
            </div>

            <div className="hidden xl:block xl:w-80 flex-shrink-0">
              <div className="sticky top-8 space-y-6">
                <ReadingSidebar />
                <GenresSection books={currentState.books} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
