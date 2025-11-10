'use client';

import { HeroSection } from '../components/HeroSection';
import { BookCarousel } from '../components/BookCarousel';
import { useEffect, useState } from 'react';
import clientApi from '../lib/client-api';
import { Book } from '../features/books/types/book.interface';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await clientApi.get('books');
        setBooks(response.data);
      } catch (error) {}
    };

    fetchBooks();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />

        <div className="space-y-16">
          <BookCarousel title="Truyện Nổi Bật" books={books} />
        </div>
      </main>
    </div>
  );
}
