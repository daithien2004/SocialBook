'use client';

import Image from 'next/image';
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { FullScreenSpinner } from '@/components/shared/AppLoading';
import { ChevronLeft } from 'lucide-react';

import { chaptersQueries } from '@/features/chapters/api/chapters.queries';
import { useRecordChapterView } from '@/features/chapters/api/chapters.mutations';
import { useCreatePost } from '@/features/posts/api/post.mutations';
import { useModalStore } from '@/store/useModalStore';
import ChapterNavigation from '@/features/chapters/components/ChapterNavigation';
import CommentSection from '@/features/chapters/components/CommentSection';
import ChapterHeader from '@/features/chapters/components/ChapterHeader';
import { ChapterContent } from '@/features/chapters/components/ChapterContent';
import { ChapterDock } from '@/features/chapters/components/ChapterDock';
import ContentProtection from '@/features/chapters/components/ContentProtection';
import AudiobookView from '@/features/chapters/components/AudiobookView';
import { ReadingTimeTracker } from '@/features/books/components/ReadingTimeTracker';
import { useReadingProgress, useAutoHideDock } from '@/features/books/hooks';
import { useAppAuth } from '@/features/auth/hooks';
import { ReadingProgressBar } from '@/features/books/components/ReadingProgressBar';
import { KnowledgeSidebar } from '@/features/reading-rooms/components/KnowledgeSidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ChapterViewClientProps {
  bookSlug: string;
  chapterSlug: string;
}

export default function ChapterViewClient({
  bookSlug,
  chapterSlug,
}: ChapterViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoplay = searchParams.get('autoplay') === 'true';

  const { isAuthenticated: isLoggedIn } = useAppAuth();

  const openCreatePost = useModalStore((s) => s.openCreatePost);
  const openAddToLibrary = useModalStore((s) => s.openAddToLibrary);
  const openChapterSummary = useModalStore((s) => s.openChapterSummary);

  const {
    data: chapterData,
    isLoading,
    error,
  } = useQuery({ ...chaptersQueries.detail({ bookSlug, chapterSlug }) });

  const { data: chaptersData } = useQuery({
    ...chaptersQueries.list({ bookSlug, limit: 1000 }),
  });
  const { mutate: recordChapterView } = useRecordChapterView();
  const createPost = useCreatePost();

  const hasRecordedViewRef = useRef<string | null>(null);
  useEffect(() => {
    if (chapterSlug && hasRecordedViewRef.current !== chapterSlug) {
      hasRecordedViewRef.current = chapterSlug;
      recordChapterView({ bookSlug, chapterSlug });
    }
  }, [bookSlug, chapterSlug, recordChapterView]);

  const book = chapterData?.book;
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  const chapters = chaptersData?.chapters || [];
  const totalChapters = chaptersData?.total || 0;
  const paragraphs = useMemo(
    () => chapter?.paragraphs || [],
    [chapter?.paragraphs],
  );

  const isControlsVisible = useAutoHideDock();

  const [viewMode, setViewMode] = useState<'read' | 'listen'>('read');
  const [showAISidebar, setShowAISidebar] = useState(false);


  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  // savedProgress đổi liên tục trong lúc cuộn, nên nếu không chốt lại thì mỗi
  // lần lưu tiến độ lại bắn thêm một toast "đọc tiếp" chồng lên màn hình.
  const resumeToastShownRef = useRef<string | null>(null);

  const { savedProgress, restoreScroll } = useReadingProgress(
    book?.id || '',
    chapter?.id || '',
    contentRef,
    !isLoading && !!chapter && viewMode === 'read' && isLoggedIn,
  );

  useEffect(() => {
    if (!chapter?.id || resumeToastShownRef.current === chapter.id) return;
    if (savedProgress > 5 && savedProgress < 100) {
      resumeToastShownRef.current = chapter.id;
      const t = setTimeout(() => {
        toast('Bạn đang đọc dở chương này', {
          description: `Tiếp tục tại vị trí ${Math.floor(savedProgress)}%?`,
          action: {
            label: 'Đọc tiếp',
            onClick: restoreScroll,
          },
          duration: 8000,
        });
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [chapter?.id, savedProgress, restoreScroll]);

  const goToPreviousChapter = useCallback(() => {
    if (navigation?.previous) {
      router.push(`/books/${bookSlug}/chapters/${navigation.previous.slug}`);
    }
  }, [navigation, bookSlug, router]);

  const goToNextChapter = useCallback(
    (autoplayNext = false) => {
      if (navigation?.next) {
        router.push(
          `/books/${bookSlug}/chapters/${navigation.next.slug}${autoplayNext === true ? '?autoplay=true' : ''}`,
        );
      }
    },
    [navigation, bookSlug, router],
  );

  const defaultShareContent = useMemo(() => {
    if (!book || !chapter) return '';
    return `📖 Đang đọc: ${book.title} - ${chapter.title}
✍️ Tác giả: ${book.authorName || 'Không rõ'}

${book.description?.slice(0, 100)}...`;
  }, [book, chapter]);

  const handleOpenShareModal = () => {
    openCreatePost({
      title: `Chia sẻ "${chapter?.title}"`,
      contentPlaceholder: 'Chia sẻ cảm nghĩ của bạn về chương này...',
      defaultContent: defaultShareContent,
      defaultBookId: book?.id,
      defaultBookTitle: book?.title,
      onSubmit: async (data) => {
        if (!book?.id) {
          toast.error('Không tìm thấy thông tin sách');
          return;
        }

        try {
          const result = await createPost.mutateAsync({
            bookId: book.id,
            content: data.content,
            images: Array.from(data.images ?? []) as unknown as FileList,
          });

          if (result.warning) {
            toast.warning('Bài viết đang được xem xét', {
              description: result.warning,
              duration: 5000,
            });
          } else {
            toast.success('Chia sẻ thành công!');
          }
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
    });
  };

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (error || !chapterData || !book || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
        <div className="text-center space-y-4">
          <p className="text-xl font-medium">⚠️ Không thể tải nội dung</p>
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
          >
            Quay lại mục lục
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'listen') {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden animate-in fade-in duration-300">
        <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-background shrink-0 z-50 transition-colors duration-300">
          <button
            onClick={() => setViewMode('read')}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Quay lại</span>
          </button>

          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('read')}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-primary transition-all"
            >
              Đọc
            </button>
            <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground shadow-lg">
              Nghe
            </button>
          </div>
          <div className="w-20" />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <ContentProtection className="h-full w-full">
            <AudiobookView
              chapterId={chapter.id}
              chapterTitle={chapter.title}
              paragraphs={chapter.paragraphs}
              bookTitle={book.title}
              bookCoverImage={book.coverUrl}
              onPrevious={() => goToPreviousChapter()}
              onNext={(shouldAutoPlay) => goToNextChapter(shouldAutoPlay)}
              hasPrevious={!!navigation?.previous}
              hasNext={!!navigation?.next}
              autoPlay={autoplay}
            />
          </ContentProtection>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-32 relative transition-colors duration-300">
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

      <ReadingTimeTracker
        key={chapter.id}
        bookId={book.id}
        chapterId={chapter.id}
      />
      <ReadingProgressBar
        chapterId={chapter.id}
        isControlsVisible={isControlsVisible}
        contentRef={contentRef}
      />

      <main className="relative z-10 pt-20 px-4 sm:px-6 lg:px-8 mx-auto transition-all duration-500 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Main Content */}
          <div
            className={`flex-1 w-full max-w-3xl transition-all duration-500 ${showAISidebar ? 'lg:mr-0' : 'mx-auto'}`}
          >
            <ChapterHeader
              bookTitle={book.title}
              bookSlug={book.slug}
              chapterTitle={chapter.title}
              chapterOrder={chapter.orderIndex}
              viewsCount={chapter.viewsCount}
            />

            <div className="mb-8">
              <ChapterNavigation
                hasPrevious={!!navigation?.previous}
                hasNext={!!navigation?.next}
                onPrevious={goToPreviousChapter}
                onNext={goToNextChapter}
              />
            </div>

            <div ref={contentRef}>
              <ContentProtection>
                <ChapterContent
                  paragraphs={paragraphs}
                  chapterId={chapter.id}
                  chapterSlug={chapterSlug}
                  bookId={book.id}
                  bookSlug={bookSlug}
                  bookCoverImage={book.coverUrl}
                />
              </ContentProtection>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <ChapterNavigation
                hasPrevious={!!navigation?.previous}
                hasNext={!!navigation?.next}
                onPrevious={goToPreviousChapter}
                onNext={goToNextChapter}
              />
            </div>

            <div className="mt-8">
              <CommentSection targetId={chapter.id} targetType="chapter" />
            </div>
          </div>

          {/* Desktop AI Sidebar */}
          {showAISidebar && !isMobile && (
            <aside className="w-full lg:w-80 sticky top-24 shrink-0 animate-in slide-in-from-right-4 duration-300">
              <KnowledgeSidebar bookSlug={bookSlug} chapterId={chapter.id} />
            </aside>
          )}

          {/* Mobile AI Sidebar (Sheet) */}
          <Sheet
            open={showAISidebar && isMobile}
            onOpenChange={setShowAISidebar}
          >
            <SheetContent
              side="bottom"
              className="h-[85vh] p-0 rounded-t-3xl border-t border-border overflow-hidden flex flex-col z-50"
            >
              <SheetTitle className="sr-only">
                Trợ lý AI phân tích nội dung
              </SheetTitle>
              <KnowledgeSidebar bookSlug={bookSlug} chapterId={chapter.id} />
            </SheetContent>
          </Sheet>
        </div>
      </main>

      <ChapterDock
        isControlsVisible={isControlsVisible}
        navigation={navigation}
        goToPreviousChapter={goToPreviousChapter}
        goToNextChapter={goToNextChapter}
        chapters={chapters}
        bookSlug={bookSlug}
        chapterSlug={chapterSlug}
        totalChapters={totalChapters}
        bookId={book.id}
        chapterId={chapter.id}
        chapterTitle={chapter.title}
        isLoggedIn={isLoggedIn}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showAISidebar={showAISidebar}
        setShowAISidebar={setShowAISidebar}
        handleOpenShareModal={handleOpenShareModal}
        openAddToLibrary={openAddToLibrary}
        openChapterSummary={openChapterSummary}
      />
    </div>
  );
}
