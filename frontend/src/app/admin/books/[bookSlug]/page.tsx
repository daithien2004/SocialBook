import { HeaderClient } from '@/features/core/components/header';
import BookDetailClient from '@/features/books/components/BookDetailClient';

interface BookDetailProps {
    params: Promise<{
        bookSlug: string;
    }>;
}

export default async function BookDetail({ params }: BookDetailProps) {
    const { bookSlug } = await params;

    return (
        <>
            <HeaderClient />
            <BookDetailClient bookSlug={bookSlug} />
        </>
    );
}
