import BookDetailClient from '@/src/components/book/BookDetailClient';

interface BookDetailProps {
  params: {
    bookSlug: string;
  };
}

export default function BookDetail({ params }: BookDetailProps) {
  return <BookDetailClient bookSlug={params.bookSlug} />;
}
