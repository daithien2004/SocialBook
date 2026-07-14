'use client';

import { useAppAuth } from '@/features/auth/hooks';
import { useGetPersonalizedRecommendationsQuery } from '@/features/recommendations/api/recommendationsApi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGetBooksQuery } from "@/features/books/api/bookApi";
import { PAGINATION } from "@/features/books/books.constants";
import type { BookRecommendation } from '@/features/recommendations/types/recommendation.interface';
import type { Book } from '@/features/books/types/book.interface';

interface BookRenderItem {
    id: string;
    book: Book;
    matchScore?: number;
    reason?: string;
}

export default function RecommendedBooks() {
    const { isAuthenticated } = useAppAuth();
    const router = useRouter();

    const limit = 12;

    const { data, isLoading, error } = useGetPersonalizedRecommendationsQuery(
        { page: 1, limit },
        { skip: !isAuthenticated }
    );
    const { data: dataBook, isLoading: isLoadingBook } = useGetBooksQuery({
        page: 1,
        limit: PAGINATION.BOOKS_PER_PAGE,
        sortBy: 'views',
    });

    const loading = isAuthenticated ? isLoading : isLoadingBook;

    if (loading) {
        return (
            <div
                className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-border">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {isAuthenticated ? 'Bạn cũng có thể thích' : 'Sách được xem nhiều'}
                    </h2>
                </div>

                <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-20 h-28 bg-slate-200 dark:bg-white/5 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
                                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isAuthenticated && error) {
        return (
            <div
                className="bg-card rounded-2xl shadow-sm border border-border p-4">
                <p className="text-sm text-red-500">
                    Không thể tải danh sách gợi ý
                </p>
            </div>
        );
    }


    const booksToRender: BookRenderItem[] = isAuthenticated
        ? (data?.recommendations || []).map((item: BookRecommendation) => ({
            id: item.bookId,
            book: item.book,
            matchScore: item.matchScore,
            reason: item.reason,
        }))
        : (dataBook?.data || []).map((item: Book) => ({
            id: item.id,
            book: item,
        }));

    if (!booksToRender.length) {
        return (
            <div
                className="bg-card rounded-2xl shadow-sm border border-border p-4">
                <p className="text-sm text-muted-foreground">
                    Chưa có sách để hiển thị
                </p>
            </div>
        );
    }

    return (
        <div
            className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-border">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    {isAuthenticated ? 'Bạn cũng có thể thích' : 'Sách được xem nhiều'}
                </h2>
            </div>

            {/* Book list */}
            <div className="max-h-[600px] overflow-y-auto thin-scrollbar">
                {booksToRender.map(({ book, id: itemId, matchScore, reason }: BookRenderItem) => {

                    return (
                        <div
                            key={itemId}
                            onClick={() => router.push(`/books/${book.slug}`)}
                            className="px-4 py-2 border-b border-slate-50 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex gap-3">
                                {/* Cover */}
                                <div
                                    className="relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border border-border shadow-sm group-hover:shadow-md transition-shadow">
                                    {book.coverUrl ? (
                                        <Image
                                            src={book.coverUrl}
                                            alt={book.title}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-gray-700" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        {book.title}
                                    </h3>

                                    <div className="text-xs text-muted-foreground mb-1.5">
                                        {book.authorId?.name || 'Unknown Author'}
                                    </div>

                                    {/* CHỈ HIỂN THỊ KHI ĐÃ LOGIN */}
                                    {matchScore && (
                                        <span
                                            className="inline-block mb-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                            Phù hợp {matchScore}%
                                        </span>
                                    )}

                                    {reason && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {reason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
