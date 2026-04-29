'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { HeaderClient } from '@/components/header/HeaderClient';
import { useModalStore } from '@/store/useModalStore';

import { useBookDetail } from '@/features/books/hooks/useBookDetail';
import { BookHero } from './BookHero';
import { BookDescription } from './BookDescription';
import { BookSidebar } from './BookSidebar';
import { ReviewSection } from './ReviewSection';


interface BookDetailClientProps {
  bookSlug: string;
}

export default function BookDetailClient({ bookSlug }: BookDetailClientProps) {
  const {
    book,
    isLoading,
    error,
    isLiked,
    isLiking,
    isCreatingPost,
    handleToggleLike,
    handleSharePost,
    defaultShareContent,
  } = useBookDetail(bookSlug);

  const { openCreatePost, openAddToLibrary } = useModalStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#161515] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#161515] flex items-center justify-center flex-col">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Không tìm thấy sách
        </h1>
        <Link
          href="/books"
          className="text-foreground border-b border-primary hover:text-primary transition-colors"
        >
          Quay lại thư viện
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground relative transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/main-background.jpg"
          alt="BG"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-40"
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90"></div>
      </div>

      <div className="relative z-10">
        <HeaderClient />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <BookHero
            book={book}
            isLiked={isLiked}
            isLiking={isLiking}
            onToggleLike={handleToggleLike}
            onOpenLibrary={() => openAddToLibrary({ bookId: book.id })}
            onOpenShare={() =>
              openCreatePost({
                title: `Chia sẻ sách "${book.title}"`,
                contentPlaceholder: "Chia sẻ suy nghĩ của bạn về cuốn sách này...",
                defaultContent: defaultShareContent,
                defaultBookId: book.id,
                defaultBookTitle: book.title,
                onSubmit: async (data) => {
                  await handleSharePost(data);
                },
              })
            }
          />

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <BookDescription
                description={book.description}
                tags={book.tags}
                title={book.title}
                author={book.authorId.name}
              />
              <ReviewSection bookId={book.id} bookSlug={book.slug} />
            </div>

            <div className="lg:col-span-1">
              <BookSidebar book={book} bookSlug={bookSlug} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
