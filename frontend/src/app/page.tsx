'use client';

import { BannerSlider } from '../components/book/BannerSlider';
import { BookSection } from '../components/book/BookSection';
import { Clock, Sparkles, Star, TrendingUp } from 'lucide-react';
import { useGetBooksQuery } from '../features/books/api/bookApi';
import { Book } from '../features/books/types/book.interface';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Header } from '@/src/components/header';

const ONE_DAY_IN_MS = 86400000; // Tính trước thay vì 1000 * 60 * 60 * 24
const NEW_BOOK_THRESHOLD_DAYS = 30;

// Tối ưu: Chỉ tính toán 1 lần
export const getTrendingBooks = (books: Book[]) => {
  return books
    .filter((book) => book.views > 2000)
    .sort((a, b) => b.views - a.views)
    .slice(0, 20); // Giới hạn số lượng hiển thị
};

export const getNewBooks = (books: Book[]) => {
  const now = Date.now(); // Tối ưu hơn new Date().getTime()
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
  // Tối ưu: Sử dụng Fisher-Yates shuffle chỉ cho số lượng cần thiết
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
    title: 'Xem Nhiều Nhất',
    getBooks: getTrendingBooks,
  },
  {
    title: 'Đề Xuất Cho Bạn',
    getBooks: getRecommendedBooks,
  },
  {
    title: 'Sách Mới Nhất',
    getBooks: getNewBooks,
  },
  {
    title: 'Đánh Giá Cao',
    getBooks: getTopRatedBooks,
  },
];

export default function HomePage() {
  const { data: books = [], isLoading } = useGetBooksQuery();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Memoize các phép tính nặng để tránh tính lại mỗi lần render
  const sections = useMemo(() => {
    if (!books.length) return [];

    return BOOK_SECTIONS.map((section) => ({
      ...section,
      books: section.getBooks(books),
    }));
  }, [books]);

  // Lấy 5 sách mới nhất cho banner
  const featuredBooks = useMemo(() => {
    return getNewBooks(books).slice(0, 5);
  }, [books]);

  // Xử lý redirect sau khi đăng nhập bằng Google
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;
      // Nếu là admin và đang ở trang chủ, redirect đến /admin
      if (userRole === 'admin' && window.location.pathname === '/') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Đang tải dữ liệu sách...</p>
        </div>
      </div>
    );
  }

  if (!books.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy sách nào.</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="container mx-auto px-4 py-8">
          <BannerSlider books={featuredBooks} />

          <div className="space-y-2">
            {sections.map((section) => (
              <BookSection
                key={section.title}
                title={section.title}
                books={section.books}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
