'use client';

import { use, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { comments } from '@/src/lib/comments';
import { useGetChapterQuery } from '@/src/features/chapters/api/chaptersApi';
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

  const { data, isLoading } = useGetChapterQuery({ bookSlug, chapterSlug });
  const chapter = data?.chapter;
  const book = data?.book;
  const navigation = data?.navigation;

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

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (navigation?.previous) {
      router.push(`/books/${bookSlug}/chapters/${navigation.previous.slug}`);
    }
  }, [navigation?.previous, bookSlug, router]);

  const handleNext = useCallback(() => {
    if (navigation?.next) {
      router.push(`/books/${bookSlug}/chapters/${navigation.next.slug}`);
    }
  }, [navigation?.next, bookSlug, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <p>Đang tải...</p>
      </div>
    );
  }

  // Error states
  if (!book || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <p>Không tìm thấy chương</p>
      </div>
    );
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
        variant="top"
        hasPrevious={!!navigation?.previous}
        hasNext={!!navigation?.next}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showTableOfContents={true}
        tableOfContentsHref={`/books/${bookSlug}`}
        tableOfContentsText="Mục lục"
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
        variant="bottom"
        hasPrevious={!!navigation?.previous}
        hasNext={!!navigation?.next}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  );
}
