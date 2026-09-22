'use client';
import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChapterContent } from '@/features/chapters/components/ChapterContent';
import ChapterHeader from '@/features/chapters/components/ChapterHeader';
import ChapterNavigation from '@/features/chapters/components/ChapterNavigation';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/shared/LoadingSpinner';

interface NavItem {
  slug: string;
  title?: string;
}

interface NavigationData {
  previous?: NavItem | null;
  next?: NavItem | null;
}

interface ChapterContentViewProps {
  isLoadingChapter: boolean;
  chapter?: {
    id: string;
    title: string;
    orderIndex: number;
    viewsCount?: number;
    paragraphs: { id: string; content: string }[];
  };
  bookData?: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
  };
  navigation?: NavigationData;
  currentChapterSlug: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onActiveParagraphChange: (id: string | null) => void;
  handleChapterNav: (slug: string) => void;
}

export function ChapterContentView({
  isLoadingChapter,
  chapter,
  bookData,
  navigation,
  currentChapterSlug,
  contentRef,
  onActiveParagraphChange,
  handleChapterNav,
}: ChapterContentViewProps) {
  const router = useRouter();

  if (isLoadingChapter) {
    return (
      <div className="min-h-[400px]">
        <LoadingOverlay>Đang tải nội dung chương...</LoadingOverlay>
      </div>
    );
  }

  if (!chapter || !bookData) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-card/50 backdrop-blur-sm border border-dashed border-border rounded-3xl">
        <Info className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-lg font-medium">Không thể tải nội dung chương</p>
        <p className="text-sm text-muted-foreground mt-1">Vui lòng kiểm tra lại kết nối hoặc quay lại sau.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.refresh()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 pb-8 border-b border-border">
        <ChapterNavigation
          hasPrevious={!!navigation?.previous}
          hasNext={!!navigation?.next}
          onPrevious={() => navigation?.previous && handleChapterNav(navigation.previous.slug)}
          onNext={() => navigation?.next && handleChapterNav(navigation.next.slug)}
        />
      </div>

      <ChapterHeader
        bookTitle={bookData.title}
        bookSlug={bookData.slug}
        chapterTitle={chapter.title}
        chapterOrder={chapter.orderIndex}
        viewsCount={chapter.viewsCount ?? 0}
        showBookLink={true}
      />

      <div ref={contentRef}>
        <ChapterContent
          paragraphs={chapter.paragraphs}
          chapterId={chapter.id}
          chapterSlug={currentChapterSlug}
          bookId={bookData.id}
          bookSlug={bookData.slug}
          bookCoverImage={bookData.coverUrl}
          bookTitle={bookData.title}
          onActiveParagraphChange={onActiveParagraphChange}
        />
      </div>

      <div className="mt-12 pt-12 border-t border-border pb-20">
        <ChapterNavigation
          hasPrevious={!!navigation?.previous}
          hasNext={!!navigation?.next}
          onPrevious={() => navigation?.previous && handleChapterNav(navigation.previous.slug)}
          onNext={() => navigation?.next && handleChapterNav(navigation.next.slug)}
        />
      </div>
    </div>
  );
}
