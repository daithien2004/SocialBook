'use client';

import Image from 'next/image';
import { use, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bookmark,
  ChevronLeft,
  List,
  Headphones,
  BookOpen,
  Settings,
  Share2,
  Sparkles,
} from 'lucide-react';

import {
  useGetChapterQuery,
  useGetChaptersQuery,
} from '@/features/chapters/api/chaptersApi';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { useModalStore } from '@/store/useModalStore';
import ChapterNavigation from '@/components/chapter/ChapterNavigation';
import CommentSection from '@/components/chapter/CommentSection';
import ChapterHeader from '@/components/chapter/ChapterHeader';
import { ChapterContent } from '@/components/chapter/ChapterContent';
import { useReadingProgress, useReadingView } from '@/features/books/hooks';
import { useAppAuth } from '@/features/auth/hooks';
import { ReadingTimeTracker } from '@/features/books/components/ReadingTimeTracker';
import AudiobookView from '@/components/chapter/AudiobookView';
import ChapterListDrawer from '@/components/book/ChapterListDrawer';
import ReadingSettingsPanel from '@/components/chapter/ReadingSettingsPanel';

interface ChapterPageProps {
  params: Promise<{
    chapterSlug: string;
    bookSlug: string;
  }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { bookSlug, chapterSlug } = use(params);
  const router = useRouter();

  const { isAuthenticated: isLoggedIn } = useAppAuth();

  const { openCreatePost, openAddToLibrary, openChapterSummary } = useModalStore();
  const {
    data: chapterData,
    isLoading,
    error,
  } = useGetChapterQuery({ bookSlug, chapterSlug });

  const { data: chaptersData } = useGetChaptersQuery({ bookSlug });
  const [createPost] = useCreatePostMutation();

  const book = chapterData?.book;
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  const chapters = chaptersData?.chapters || [];
  const totalChapters = chaptersData?.total || 0;

  const {
    viewMode,
    isControlsVisible,
    showTOC,
    showSettings,
    setViewMode,
    setShowTOC,
    setShowSettings,
  } = useReadingView();

  const { savedProgress, restoreScroll } = useReadingProgress(
    book?.id || '',
    chapter?.id || '',
    !isLoading && !!chapter && viewMode === 'read' && isLoggedIn
  );

  useEffect(() => {
    if (savedProgress > 5) {
      setTimeout(() => {
        toast('Bạn đang đọc dở chương này', {
          description: `Tiếp tục tại vị trí ${Math.floor(savedProgress)}%?`,
          action: {
            label: 'Đọc tiếp',
            onClick: restoreScroll,
          },
          duration: 8000,
        });
      }, 1000);
    }
  }, [savedProgress, restoreScroll]);

  const defaultShareContent = useMemo(() => {
    if (!book || !chapter) return '';
    return `📖 Đang đọc: ${book.title} - ${chapter.title}
✍️ Tác giả: ${book.authorId.name}

${book.description?.slice(0, 100)}...

#${book.title.replace(/\s+/g, '')} #${chapter.title.replace(/\s+/g, '')}`;
  }, [book, chapter]);

  const handleOpenShareModal = () => {
    openCreatePost({
      title: `Chia sẻ "${chapter?.title}"`,
      contentPlaceholder: "Chia sẻ cảm nghĩ của bạn về chương này...",
      defaultContent: defaultShareContent,
      onSubmit: async (data) => {
        if (!book?.id) {
          toast.error('Không tìm thấy thông tin sách');
          return;
        }

        try {
          const result = await createPost({
            bookId: book.id,
            content: data.content,
            images: data.images,
          }).unwrap();

          if (result.warning) {
            toast.warning('Bài viết đang được xem xét', {
              description: result.warning,
              duration: 5000
            });
          } else {
            toast.success('Chia sẻ thành công!');
          }
        } catch (error: any) {
          if (error?.status !== 401) {
            toast.error(error?.data?.message || 'Không thể tạo bài viết');
          }
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
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
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Quay lại</span>
          </button>

          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('read')}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
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

      <ReadingTimeTracker bookId={book.id} chapterId={chapter.id} />

      <div
        className="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-300 ease-out"
        style={{
          width: `${savedProgress}%`,
          opacity: isControlsVisible ? 1 : 0,
        }}
      />

      <main className="relative z-10 pt-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-3xl transition-opacity duration-500">
        <ChapterHeader
          bookTitle={book.title}
          bookSlug={book.slug}
          chapterTitle={chapter.title}
          chapterOrder={chapter.orderIndex}
          viewsCount={chapter.viewsCount}
        />

        <ChapterContent
          paragraphs={chapter.paragraphs}
          chapterId={chapter.id}
          bookId={book.id}
          bookCoverImage={book.coverUrl}
          bookTitle={book.title}
        />

        <div className="mt-12 pt-8 border-t border-border">
          <ChapterNavigation
            hasPrevious={!!navigation?.previous}
            hasNext={!!navigation?.next}
            onPrevious={() =>
              navigation?.previous &&
              router.push(
                `/books/${bookSlug}/chapters/${navigation.previous.slug}`
              )
            }
            onNext={() =>
              navigation?.next &&
              router.push(`/books/${bookSlug}/chapters/${navigation.next.slug}`)
            }
          />
        </div>

        <div className="mt-8">
          <CommentSection targetId={chapter.id} targetType="chapter" />
        </div>
      </main>

      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          isControlsVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0'
        }`}
      >
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-background/90 backdrop-blur-xl border border-border shadow-2xl">
          <DockButton
            icon={<List size={20} />}
            label="Mục lục"
            onClick={() => setShowTOC(true)}
          />

          <div className="w-px h-6 bg-border mx-1" />

          <div className="flex bg-muted rounded-xl p-1">
            <button
              onClick={() => setViewMode('read')}
              className="p-2 rounded-lg bg-background text-foreground shadow-sm transition-all"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setViewMode('listen')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
            >
              <Headphones size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          <DockButton
            icon={<Bookmark size={20} />}
            label="Lưu"
            onClick={() => openAddToLibrary({ bookId: book.id })}
          />

          <DockButton
            icon={<Share2 size={20} />}
            label="Chia sẻ"
            onClick={handleOpenShareModal}
          />

          <DockButton
            icon={<Sparkles size={20} />}
            label="Tóm tắt AI"
            onClick={() => openChapterSummary({
              chapterId: chapter.id,
              chapterTitle: chapter.title
            })}
          />

          <DockButton
            icon={<Settings size={20} />}
            label="Cài đặt"
            onClick={() => setShowSettings(true)}
          />
        </div>
      </div>

      <ChapterListDrawer
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
        chapters={chapters}
        bookSlug={bookSlug}
        currentChapterSlug={chapterSlug}
        totalChapters={totalChapters}
      />


      <ReadingSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

function DockButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all group"
    >
      {icon}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none border border-border">
        {label}
      </span>
    </button>
  );
}
