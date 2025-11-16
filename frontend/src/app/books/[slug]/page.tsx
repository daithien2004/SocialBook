import BookDetailClient from './BookDetailClient';

interface BookDetailProps {
  params: {
    slug: string;
  }
}

export default function BookDetail({ params }: BookDetailProps) {
  return <BookDetailClient slug={params.slug} />;
}