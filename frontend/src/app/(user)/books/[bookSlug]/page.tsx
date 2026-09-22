import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import BookDetailClient from '@/features/books/components/BookDetailClient';
import { fetchBookBySlugServer } from '@/features/books/api/server-data';
import { bookKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query-server';
import { withTimeout } from '@/lib/server-prefetch';

interface BookDetailProps {
  params: Promise<{
    bookSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookDetailProps): Promise<Metadata> {
  const { bookSlug } = await params;
  const book = await withTimeout(fetchBookBySlugServer(bookSlug)).catch(
    () => null,
  );

  if (!book?.title || !book?.description) {
    return { title: 'SocialBook' };
  }

  return {
    title: book.title,
    description: book.description,
    openGraph: {
      title: book.title,
      description: book.description,
      type: 'book',
      images: book.coverUrl ? [{ url: book.coverUrl }] : undefined,
    },
    alternates: { canonical: `/books/${bookSlug}` },
  };
}

export default async function BookDetail({ params }: BookDetailProps) {
  const { bookSlug } = await params;

  const queryClient = getQueryClient();
  await withTimeout(
    queryClient.query({
      queryKey: bookKeys.detail(bookSlug),
      queryFn: () => fetchBookBySlugServer(bookSlug),
    }),
  ).catch(() => null);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookDetailClient bookSlug={bookSlug} />
    </HydrationBoundary>
  );
}