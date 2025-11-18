'use client';

import { BannerSlider } from '../components/book/BannerSlider';
import { BookSection } from '../components/book/BookSection';
import { Clock, Sparkles, Star, TrendingUp } from 'lucide-react';
import { useGetBooksQuery } from '../features/books/api/bookApi';
import { Book } from '../features/books/types/book.interface';

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const NEW_BOOK_THRESHOLD_DAYS = 30;

export const getTrendingBooks = (books: Book[]) => {
  return books
    .filter((book) => book.views > 2000)
    .sort((a, b) => b.views - a.views);
};

export const getNewBooks = (books: Book[]) => {
  const now = new Date().getTime();

  return books
    .filter((book) => {
      const bookDate = new Date(book.createdAt).getTime();
      const diffTime = Math.abs(now - bookDate);
      const diffDays = Math.ceil(diffTime / ONE_DAY_IN_MS);
      return diffDays <= NEW_BOOK_THRESHOLD_DAYS;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const getTopRatedBooks = (books: Book[]) => {
  return [...books].sort((a, b) => {
    const ratingA = a.views > 0 ? a.likes / a.views : 0;
    const ratingB = b.views > 0 ? b.likes / b.views : 0;
    return ratingB - ratingA;
  });
};

export const getRecommendedBooks = (books: Book[]) => {
  return [...books].sort(() => Math.random() - 0.5);
};

const BOOK_SECTIONS = [
  {
    title: 'Xem Nhiều Nhất',
    icon: TrendingUp,
    iconColor: 'bg-gradient-to-br from-red-500 to-orange-500',
    getBooks: getTrendingBooks,
  },
  {
    title: 'Đề Xuất Cho Bạn',
    icon: Sparkles,
    iconColor: 'bg-gradient-to-br from-purple-500 to-pink-500',
    getBooks: getRecommendedBooks,
  },
  {
    title: 'Sách Mới Nhất',
    icon: Clock,
    iconColor: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    getBooks: getNewBooks,
  },
  {
    title: 'Đánh Giá Cao',
    icon: Star,
    iconColor: 'bg-gradient-to-br from-yellow-500 to-amber-500',
    getBooks: getTopRatedBooks,
  },
];

export default function HomePage() {
  const { data, isLoading } = useGetBooksQuery();

  const books = data?.books ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải dữ liệu sách...
      </div>
    );
  }

  if (!books.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Không tìm thấy sách nào.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 py-8">
        <BannerSlider />

        <div className="space-y-8">
          {BOOK_SECTIONS.map((section) => (
            <BookSection
              key={section.title}
              title={section.title}
              icon={section.icon}
              iconColor={section.iconColor}
              books={section.getBooks(books)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
