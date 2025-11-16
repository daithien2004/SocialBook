import BookDetailClient from '../../../components/book/BookDetailClient';

interface BookDetailProps {
  params: {
    slug: string;
  };
}

export default function BookDetail({ params }: BookDetailProps) {
  return <BookDetailClient bookSlug={params.slug} />;
}
