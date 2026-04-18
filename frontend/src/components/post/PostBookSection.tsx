'use client';

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Book } from '@/features/books/types/book.interface';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface PostBookSectionProps {
    book: Book;
}

export function PostBookSection({ book }: PostBookSectionProps) {
    const route = useRouter();

    const navigateToBook = useCallback(() => route.push(`/books/${book.slug}`), [route, book.slug]);

    return (
        <div
            className="p-3 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-800 flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800/60 transition-colors"
            onClick={navigateToBook}
        >
            <div className="shrink-0 w-14 h-20 rounded-md overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800">
                <Image
                    src={book.coverUrl || '/abstract-book-pattern.png'}
                    alt={book.title}
                    width={56}
                    height={80}
                    sizes="56px"
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium uppercase tracking-wide gap-1 bg-primary/10 text-primary dark:text-primary-foreground/90 hover:bg-primary/20">
                    <BookOpen size={10} />
                    Đang đọc
                </Badge>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-gray-100 truncate mt-1" title={book.title}>
                    {book.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                    {book.authorId?.name || 'Tác giả ẩn danh'}
                </p>
            </div>
        </div>
    );
}
