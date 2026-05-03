import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SafeImage } from '../common/SafeImage';
import React, { memo, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from '@/features/books/types/book.interface';
import { cn, formatCompact } from '@/lib/utils';
import { useModalStore } from '@/store/useModalStore';

interface BookCardProps {
    book: Book;
    priority?: boolean;
}

export const BookCard = memo(function BookCard({ book, priority }: BookCardProps) {
    const { openAddToLibrary, isAddToLibraryOpen, addToLibraryData } = useModalStore();
    const isCurrentBookOpen = isAddToLibraryOpen && addToLibraryData?.bookId === book.id;

    const handleAddToLibrary = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openAddToLibrary({ bookId: book.id });
    }, [book.id, openAddToLibrary]);

    return (
        <>
            <Link
                href={`/books/${book.slug}`}
                className="group relative block w-full max-w-[220px]"
            >
                <Card className="overflow-hidden border-gray-200 dark:border-white/10 transition-all duration-500 hover:border-gray-400 dark:hover:border-white/30 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-card text-card-foreground">
                    <BookCover book={book} priority={priority} />
                    <CardContent className="flex flex-col p-4 pt-2">
                        <BookInfo book={book} />
                        <BookStats book={book} handleAddToLibrary={handleAddToLibrary} isCurrentBookOpen={isCurrentBookOpen} />
                    </CardContent>
                </Card>
            </Link>
        </>
    );
});

function BookCover({ book, priority }: { book: Book, priority?: boolean }) {
    return (
        <div className="relative aspect-[2/3] w-full overflow-hidden">
            <SafeImage
                src={book.coverUrl}
                alt={book.title}
                fill
                priority={priority}
                sizes="(max-width: 768px) 160px, 220px"
                className="object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:contrast-125"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
        </div>
    );
}

function BookInfo({ book }: { book: Book }) {
    return (
        <div className="mb-1 text-center">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                {book.authorId.name}
            </p>
            <h3 className="mb-4 text-center text-sm font-notosans font-semibold text-foreground bg-clip-text group-hover:text-red-600 dark:group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all line-clamp-2">
                {book.title}
            </h3>
        </div>
    );
}

interface BookStatsProps {
    book: Book;
    handleAddToLibrary: (e: React.MouseEvent) => void;
    isCurrentBookOpen: boolean;
}

function BookStats({ book, handleAddToLibrary, isCurrentBookOpen }: BookStatsProps) {
    return (
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-muted-foreground">
                <span>VOL {book.stats?.chapterCount || 0}</span>

                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>

                <span className="flex items-center gap-1">
                    {formatCompact(book.stats?.views || 0)}
                </span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                aria-label="Thêm vào danh sách đọc"
                onClick={handleAddToLibrary}
                className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:hover:text-white hover:bg-transparent"
                title="Save to Library"
            >
                <Bookmark
                    size={16}
                    className="transition-transform hover:scale-110"
                    fill={isCurrentBookOpen ? 'currentColor' : 'none'}
                />
            </Button>
        </div>
    );
}
