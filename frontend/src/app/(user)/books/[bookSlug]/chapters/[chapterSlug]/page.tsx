'use client';

import { use, useMemo, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { comments } from '@/src/lib/comments';
import { Bookmark } from 'lucide-react'; // Import Icon

// --- IMPORTS LIÊN QUAN ĐẾN THƯ VIỆN ---
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';

import {
  useGetChapterQuery,
  useGetChaptersQuery,
} from '@/src/features/chapters/api/chaptersApi';
import ChapterNavigation from '@/src/components/chapter/ChapterNavigation';
import CommentSection from '@/src/components/chapter/CommentSection';
import ChapterHeader from '@/src/components/chapter/ChapterHeader';
import { ChapterContent } from '@/src/components/chapter/ChapterContent';
import { useReadingProgress } from '@/src/hooks/useReadingProgress';
import ResumeReadingToast from '@/src/components/chapter/ResumeReadingToast';
import AudiobookView from '@/src/components/chapter/AudiobookView';

interface ChapterPageProps {
  params: Promise<{
    chapterSlug: string;
    bookSlug: string;
  }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { bookSlug, chapterSlug } = use(params);
  const router = useRouter();

  // State UI
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'read' | 'listen'>('read'); // New View Mode State

  // API: Lấy thông tin chương hiện tại
  const {
    data: chapterData,
    isLoading,
    error,
  } = useGetChapterQuery({
    bookSlug,
    chapterSlug,
  });

  // API: Lấy danh sách chương (Mục lục)
  const { data: chaptersData } = useGetChaptersQuery({ bookSlug });

  // Destructure data
  const book = chapterData?.book;
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  const chapters = chaptersData?.chapters || [];
  const totalChapters = chaptersData?.total || 0;
  const currentChapterIndex = chapters.findIndex((c) => c.slug === chapterSlug);

  const { savedProgress, restoreScroll } = useReadingProgress(
    book?.id || '',
    chapter?.id || '',
    !isLoading && !!chapter && viewMode === 'read' // Only track progress in read mode
  );

  const [isToastClosed, setIsToastClosed] = useState(false);

  // Chapter comments logic
  const chapterComments = useMemo(() => {
    if (!chapter?.id) return [];
    return comments
      .filter((c) => c.targetType === 'chapter' && c.targetId === chapter.id)
      .map((c) => ({ ...c, targetType: 'chapter' as const }));
  }, [chapter?.id]);

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

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
          <p className="mt-4">Đang tải chương...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATES ---
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

  // --- AUDIOBOOK VIEW ---
  if (viewMode === 'listen') {
    return (
      <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
        {/* Header with Back & Mode Switch */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 bg-[#1a1a1a] shrink-0 z-50">
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Quay lại
          </button>

          {/* Mode Switcher */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode('read')}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white transition-all"
            >
              Đọc sách
            </button>
            <button
              onClick={() => setViewMode('listen')}
              className="px-4 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white shadow-lg transition-all"
            >
              Nghe sách
            </button>
          </div>

          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Audiobook Component */}
        <div className="flex-1 overflow-hidden relative">
          <AudiobookView
            chapterId={chapter.id}
            chapterTitle={chapter.title}
            paragraphs={chapter.paragraphs}
            bookTitle={book.title}
            bookCoverImage={book.coverUrl}
          />
        </div>
      </div>
    );
  }

  // --- READ MODE (Standard View) ---
  return (
    <div className="min-h-screen flex flex-col bg-black/90 text-white relative">
      {/* Mode Switcher Overlay for Read Mode */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-xl">
          <button
            onClick={() => setViewMode('read')}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-white/10 text-white shadow-sm transition-all"
          >
            Đọc sách
          </button>
          <button
            onClick={() => setViewMode('listen')}
            className="px-4 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Nghe sách
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsLibraryModalOpen(true)}
        className="fixed top-24 right-4 z-50 p-3 bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-blue-600 transition-colors shadow-lg border border-gray-700"
        title="Lưu vào thư viện"
      >
        <Bookmark size={20} className="text-white" />
      </button>

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
            {/* Header Modal */}
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
                        className={`w-full text-left p-4 rounded-lg transition-all ${isCurrentChapter
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

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50 flex justify-between items-center">
              <p className="text-sm text-gray-400">
                Tổng cộng {totalChapters} chương
              </p>
              {/* Nút thêm vào thư viện trong modal TOC cũng tiện */}
              <button
                onClick={() => {
                  setShowTableOfContents(false);
                  setIsLibraryModalOpen(true);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Bookmark size={14} /> Lưu sách này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 3. RENDER MODAL THƯ VIỆN --- */}
      {book && (
        <AddToLibraryModal
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
          bookId={book.id}
        />
      )}

      {!isToastClosed && (
        <ResumeReadingToast
          progress={savedProgress}
          onConfirm={restoreScroll} // Gọi hàm scroll khi user đồng ý
          onClose={() => setIsToastClosed(true)} // Ẩn toast khi user từ chối
        />
      )}
    </div>
  );
}
