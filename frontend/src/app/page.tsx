'use client';

import { BannerSlider } from '../components/book/BannerSlider';
import { BookSection } from '../components/book/BookSection';
import { Flame, Sparkles, BookPlus, Star } from 'lucide-react';
import { useGetBooksQuery } from '../features/books/api/bookApi';
import { Book } from '../features/books/types/book.interface';
import { useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '../components/header';
import { ReadingSidebar } from '../components/book/ReadingSidebar';
import { MobileReadingSection } from '../components/book/MobileReadingSection';
import { GenresSection } from '../components/book/GenresSection';

const ONE_DAY_IN_MS = 86400000;
const NEW_BOOK_THRESHOLD_DAYS = 30;

export const getTrendingBooks = (books: Book[]) => {
  return books
    .filter((book) => book.views > 2000)
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);
};

export const getNewBooks = (books: Book[]) => {
  const now = Date.now();
  const threshold = now - NEW_BOOK_THRESHOLD_DAYS * ONE_DAY_IN_MS;
  return books
    .filter((book) => new Date(book.createdAt).getTime() >= threshold)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 20);
};

export const getTopRatedBooks = (books: Book[]) => {
  return books
    .map((book) => ({
      ...book,
      rating: book.views > 0 ? book.likes / book.views : 0,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 20);
};

export const getRecommendedBooks = (books: Book[]) => {
  const shuffled = [...books];
  const limit = Math.min(20, shuffled.length);
  for (let i = 0; i < limit; i++) {
    const j = Math.floor(Math.random() * (shuffled.length - i)) + i;
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
};

const BOOK_SECTIONS = [
  {
    title: 'Sách hot nhất hiện nay',
    icon: Flame,
    getBooks: getTrendingBooks,
  },
  {
    title: 'Gợi ý dành riêng cho bạn',
    icon: Sparkles,
    getBooks: getRecommendedBooks,
  },
  {
    title: 'Mới cập nhật gần đây',
    icon: BookPlus,
    getBooks: getNewBooks,
  },
  {
    title: 'Được đánh giá tốt nhất',
    icon: Star,
    getBooks: getTopRatedBooks,
  },
];

export default function HomePage() {
  const { data: books = [], isLoading } = useGetBooksQuery();
  const { data: session, status } = useSession();
  const router = useRouter();

  const sections = useMemo(() => {
    if (!books.length) return [];
    return BOOK_SECTIONS.map((section) => ({
      ...section,
      books: section.getBooks(books),
    }));
  }, [books]);

  const featuredBooks = useMemo(() => {
    return getNewBooks(books).slice(0, 5);
  }, [books]);

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user?.role === 'admin' &&
      window.location.pathname === '/'
    ) {
      router.push('/admin');
    }
  }, [status, session, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#141414] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      <div className="relative z-10">
        <Header session={session} />

        <main>
          {/* Banner Section */}
          <div className="pb-8">
            <BannerSlider books={featuredBooks} />
          </div>

          {/* Mobile Reading Section - Hiển thị trên tablet/mobile */}
          <MobileReadingSection />

          {/* Main Content with Sidebar Layout */}
          <div className="max-w-[1920px] mx-auto px-4 xl:px-8 flex gap-8">
            {/* Left: Book Sections */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-8 pb-20 mt-4">
                {sections.map((section) => (
                  <BookSection
                    key={section.title}
                    title={section.title}
                    books={section.books}
                    icon={section.icon}
                  />
                ))}
              </div>
            </div>

            <div className="hidden xl:block xl:w-80 flex-shrink-0">
              <div className="sticky top-8 space-y-6">
                <ReadingSidebar />

                {/* Section Thể loại */}
                <GenresSection books={books} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
