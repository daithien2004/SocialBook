import BookDetailClient from '../../../components/book/BookDetailClient';

interface BookDetailProps {
  params: Promise<{
    bookSlug: string;
  }>;
}

export default async function BookDetail({ params }: BookDetailProps) {
  const { bookSlug } = await params;

  return <BookDetailClient bookSlug={bookSlug} />;
}
