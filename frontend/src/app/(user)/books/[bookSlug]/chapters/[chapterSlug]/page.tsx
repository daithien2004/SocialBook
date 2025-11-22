'use client';

import { use, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { comments } from '@/src/lib/comments';
import {
  useGetChapterQuery,
  useGetChaptersQuery,
} from '@/src/features/chapters/api/chaptersApi';
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
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  // Get current chapter data
  const {
    data: chapterData,
    isLoading,
    error,
  } = useGetChapterQuery({
    bookSlug,
    chapterSlug,
  });

  // Get all chapters for table of contents
  const { data: chaptersData } = useGetChaptersQuery({ bookSlug });

  // Destructure data với đúng cấu trúc API
  const book = chapterData?.book;
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  // Lấy danh sách chapters và total từ chaptersData
  const chapters = chaptersData?.chapters || [];
  const totalChapters = chaptersData?.total || 0;
  const currentChapterIndex = chapters.findIndex((c) => c.slug === chapterSlug);

  // Chapter comments
  const chapterComments = useMemo(() => {
    if (!chapter?.id) return [];

    return comments
      .filter((c) => c.targetType === 'chapter' && c.targetId === chapter.id)
      .map((c) => ({ ...c, targetType: 'chapter' as const }));
  }, [chapter?.id]);

  // Comment handlers
  const handleSubmitComment = useCallback(async (content: string) => {
    console.log('New comment:', content);
  }, []);

  const handleLikeComment = useCallback((commentId: string) => {
    console.log('Like comment:', commentId);
  }, []);

  const handleReplyComment = useCallback((commentId: string) => {
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

  const handleChapterSelect = useCallback(
    (slug: string) => {
      setShowTableOfContents(false);
      router.push(`/books/${bookSlug}/chapters/${slug}`);
    },
    [bookSlug, router]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4">Đang tải chương...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (error || !chapterData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">⚠️ Có lỗi xảy ra</p>
          <p className="text-gray-400">Không thể tải nội dung chương</p>
        </div>
      </div>
    );
  }

  if (!book || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">📖 Không tìm thấy chương</p>
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Quay lại mục lục
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black/90 text-white">
      <ChapterHeader
        bookTitle={book.title}
        bookSlug={book.slug}
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
        onTableOfContentsClick={() => setShowTableOfContents(true)}
        tableOfContentsText="Mục lục"
      />

      <ChapterContent
        paragraphs={chapter.paragraphs}
        chapterId={chapter.id}
        bookId={book.id}
        bookCoverImage={book.coverUrl}
        bookTitle={book.title}
      />

      <ChapterNavigation
        variant="bottom"
        hasPrevious={!!navigation?.previous}
        hasNext={!!navigation?.next}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <CommentSection
          comments={chapterComments}
          targetId={chapter.id}
          targetType="chapter"
          onSubmitComment={handleSubmitComment}
          onLikeComment={handleLikeComment}
          onReplyComment={handleReplyComment}
      />

      {/* Table of Contents Modal */}
      {showTableOfContents && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTableOfContents(false)}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{book.title}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Trang {currentChapterIndex + 1}/{totalChapters}
                </p>
              </div>
              <button
                onClick={() => setShowTableOfContents(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                aria-label="Đóng"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Chapters List */}
            <div className="overflow-y-auto flex-1 p-4">
              {chapters.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Không có chương nào
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chap) => {
                    const isCurrentChapter = chap.slug === chapterSlug;
                    return (
                      <button
                        key={chap.id}
                        onClick={() => handleChapterSelect(chap.slug)}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          isCurrentChapter
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                Chương {chap.orderIndex}
                              </span>
                              {isCurrentChapter && (
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                  Đang đọc
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-1 opacity-90">
                              {chap.title}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-xs text-gray-400">
                              👁️ {chap.viewsCount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
              <p className="text-sm text-gray-400 text-center">
                Tổng cộng {totalChapters} chương
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
