import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import ChapterViewClient from '@/features/chapters/components/ChapterViewClient';
import { fetchChapterDetailServer } from '@/features/chapters/api/server-data';
import { chapterKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query-server';
import { withTimeout } from '@/lib/server-prefetch';

interface ChapterPageProps {
  params: Promise<{
    chapterSlug: string;
    bookSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { bookSlug, chapterSlug } = await params;
  const data = await withTimeout(
    fetchChapterDetailServer(bookSlug, chapterSlug),
  ).catch(() => null);

  if (!data?.chapter?.title || !data?.book?.title) {
    return { title: 'SocialBook' };
  }

  const title = `${data.chapter.title} · ${data.book.title}`;

  return {
    title,
    description: data.book.description,
    openGraph: {
      title,
      description: data.book.description,
      type: 'article',
      images: data.book.coverUrl ? [{ url: data.book.coverUrl }] : undefined,
    },
    alternates: { canonical: `/books/${bookSlug}/chapters/${chapterSlug}` },
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { bookSlug, chapterSlug } = await params;

  const queryClient = getQueryClient();
  await withTimeout(
    queryClient.query({
      queryKey: chapterKeys.detail(bookSlug, chapterSlug),
      queryFn: () => fetchChapterDetailServer(bookSlug, chapterSlug),
    }),
  ).catch(() => null);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        }
      >
        <ChapterViewClient bookSlug={bookSlug} chapterSlug={chapterSlug} />
      </Suspense>
    </HydrationBoundary>
  );
}