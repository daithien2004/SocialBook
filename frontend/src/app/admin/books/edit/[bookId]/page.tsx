import EditBook from '@/features/admin/components/book/EditBook';

interface PageProps {
    params: Promise<{
        bookId: string;
    }>;
}

export default async function EditBookPage({ params }: PageProps) {
    const { bookId } = await params;

    return <EditBook bookId={bookId} />;
}
