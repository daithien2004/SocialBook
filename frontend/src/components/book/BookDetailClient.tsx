// src/app/books/[slug]/BookDetailClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeaderClient } from '@/src/components/HeaderClient';

// Hooks & Components
import { useBookDetail } from '@/src/features/books/hooks/useBookDetail';
import { BookHero } from './BookHero';
import { BookDescription } from './BookDescription';
import { BookSidebar } from './BookSidebar';
import { BookModals } from './BookModals';
import { ReviewSection } from './ReviewSection';

interface BookDetailClientProps {
  bookSlug: string;
}

export default function BookDetailClient({ bookSlug }: BookDetailClientProps) {
  // 1. Hook Logic
  const {
    book,
    isLoading,
    error,
    isLiking,
    isCreatingPost,
    handleToggleLike,
    handleSharePost,
    defaultShareContent,
  } = useBookDetail(bookSlug);

  // 2. Local UI State (Modals)
  const [isLibraryModalOpen, setLibraryModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  // 3. Loading & Error UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#161515] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#161515] flex items-center justify-center flex-col">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Không tìm thấy sách
        </h1>
        <Link
          href="/books"
          className="text-gray-900 dark:text-white border-b border-red-500"
        >
          Quay lại thư viện
        </Link>
      </div>
    );
  }

  // 4. Main Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="BG"
          className="w-full h-full object-cover opacity-10 dark:opacity-40"
        />
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0f0f0f]/70"></div>
      </div>

      <div className="relative z-10">
        <HeaderClient session={null} />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Hero Section */}
          <BookHero
            book={book}
            isLiking={isLiking}
            onToggleLike={handleToggleLike}
            onOpenLibrary={() => setLibraryModalOpen(true)}
            onOpenShare={() => setShareModalOpen(true)}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <BookDescription
                description={book.description}
                tags={book.tags}
                title={book.title}
                author={book.authorId.name}
              />
              <ReviewSection bookId={book.id} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BookSidebar book={book} bookSlug={bookSlug} />
            </div>
          </div>
        </div>

        {/* Modals Container */}
        <BookModals
          book={book}
          isLibraryOpen={isLibraryModalOpen}
          isShareOpen={isShareModalOpen}
          closeLibrary={() => setLibraryModalOpen(false)}
          closeShare={() => setShareModalOpen(false)}
          onShareSubmit={async (data: any) => {
            const success = await handleSharePost(data);
            if (success) setShareModalOpen(false);
          }}
          defaultShareContent={defaultShareContent}
          isSharing={isCreatingPost}
        />
      </div>
    </div>
  );
}
