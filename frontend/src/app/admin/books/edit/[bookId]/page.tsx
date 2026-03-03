// src/app/admin/books/edit/[bookId]/page.tsx
'use client';

import EditBook from '@/components/admin/book/EditBook';
import { use } from 'react';

interface PageProps {
    params: Promise<{
        bookId: string;
    }>;
}

export default function EditBookPage({ params }: PageProps) {
    const { bookId } = use(params);

    return <EditBook bookId={bookId} />;
}
