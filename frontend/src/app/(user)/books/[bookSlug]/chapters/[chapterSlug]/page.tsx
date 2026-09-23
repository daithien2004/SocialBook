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
    bookSlug: string;
    chapterSlug: string;
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

async function ChapterPageContent({ params }: ChapterPageProps) {
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
      <ChapterViewClient bookSlug={bookSlug} chapterSlug={chapterSlug} />
    </HydrationBoundary>
  );
}

export default function ChapterPage({ params }: ChapterPageProps) {
  return (
    <Suspense fallback={null}>
      <ChapterPageContent params={params} />
    </Suspense>
  );
}