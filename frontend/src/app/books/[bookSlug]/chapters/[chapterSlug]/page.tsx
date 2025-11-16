'use client';

import { use, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { comments } from '@/src/lib/comments';
import {
  useGetChapterQuery,
  useGetChaptersQuery,
} from '@/src/features/chapters/api/chaptersApi';
import { useGetBookBySlugQuery } from '@/src/features/books/api/bookApi';
import ChapterNavigation from '@/src/components/chapter/ChapterNavigation';
import CommentSection from '@/src/components/chapter/CommentSection';
import ChapterHeader from '@/src/components/chapter/ChapterHeader';
import { ChapterContent } from '@/src/components/chapter/ChapterContent';

interface ChapterPageProps {
  params: Promise<{
    chapterSlug: string;
    bookSlug: string;
  }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { bookSlug, chapterSlug } = use(params);
  const router = useRouter();

  // API Queries
  const { data: book } = useGetBookBySlugQuery({ bookSlug });
  const { data: chapter } = useGetChapterQuery({ bookSlug, chapterSlug });
  const { data: chapters } = useGetChaptersQuery({ bookSlug });

  // Sorted chapters for the current book
  const sortedChapters = useMemo(() => {
    if (!chapters || !book?.id) return [];

    return chapters
      .filter((ch) => ch.bookId === book.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [chapters, book?.id]);

  // Current chapter position
  const currentIndex = useMemo(
    () => sortedChapters.findIndex((ch) => ch.id === chapter?.id),
    [sortedChapters, chapter?.id]
  );

  // Navigation handlers
  const navigateToChapter = useCallback(
    (index: number) => {
      const targetChapter = sortedChapters[index];
      if (targetChapter) {
        router.push(`/books/${bookSlug}/chapters/${targetChapter.slug}`);
      }
    },
    [sortedChapters, bookSlug, router]
  );

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigateToChapter(currentIndex - 1);
    }
  }, [currentIndex, navigateToChapter]);

  const goToNext = useCallback(() => {
    if (currentIndex < sortedChapters.length - 1) {
      navigateToChapter(currentIndex + 1);
    }
  }, [currentIndex, sortedChapters.length, navigateToChapter]);

  // Chapter comments
  const chapterComments = useMemo(() => {
    if (!chapter?.id) return [];

    return comments
      .filter((c) => c.targetType === 'chapter' && c.targetId === chapter.id)
      .map((c) => ({ ...c, targetType: 'chapter' as const }));
  }, [chapter?.id]);

  // Comment handlers
  const handleSubmitComment = useCallback(async (content: string) => {
    // TODO: Implement API call
    console.log('New comment:', content);
  }, []);

  const handleLikeComment = useCallback((commentId: string) => {
    // TODO: Implement API call
    console.log('Like comment:', commentId);
  }, []);

  const handleReplyComment = useCallback((commentId: string) => {
    // TODO: Implement API call
    console.log('Reply to:', commentId);
  }, []);

  // Error states
  if (!book) {
    return null;
  }

  if (!chapter) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black/90 text-white">
      <ChapterHeader
        bookTitle={book.title}
        bookSlug={bookSlug}
        chapterTitle={chapter.title}
        chapterOrder={chapter.orderIndex}
        viewsCount={chapter.viewsCount}
      />

      <ChapterNavigation
        currentIndex={currentIndex}
        totalChapters={sortedChapters.length}
        onPrevious={goToPrevious}
        onNext={goToNext}
        variant="top"
      />

      <ChapterContent paragraphs={chapter.paragraphs} />

      <CommentSection
        comments={chapterComments}
        targetId={chapter.id}
        targetType="chapter"
        onSubmitComment={handleSubmitComment}
        onLikeComment={handleLikeComment}
        onReplyComment={handleReplyComment}
      />

      <ChapterNavigation
        currentIndex={currentIndex}
        totalChapters={sortedChapters.length}
        onPrevious={goToPrevious}
        onNext={goToNext}
        variant="bottom"
        showTableOfContents
        tableOfContentsHref={`/books/${bookSlug}`}
      />
    </div>
  );
}
