'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { useGetTrendingBooksQuery } from '@/features/posts/api/postApi';

export default function TrendingBooksWidget() {
    const { data, isLoading } = useGetTrendingBooksQuery({ days: 30, limit: 5 });
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="h-48 rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900 animate-pulse" />
        );
    }

    const trendingBooks = data || [];

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Sách Hot Trong Tháng
                </h2>
            </div>

            <div className="max-h-[340px] overflow-y-auto thin-scrollbar pr-1">
                {trendingBooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-slate-200 dark:border-neutral-700">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center mb-3 shadow-sm border border-slate-100 dark:border-neutral-800">
                            <TrendingUp className="w-6 h-6 text-slate-300 dark:text-neutral-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">Chưa có dữ liệu</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
                            Hãy là người đầu tiên tương tác với các cuốn sách tuần này!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {trendingBooks.map((book) => (
                            <div
                                key={book.bookId}
                                onClick={() => router.push(`/books/${book.slug}`)}
                                className="flex items-start gap-3 cursor-pointer group"
                            >
                                <div className="flex-shrink-0">
                                    <Image
                                        src={book.coverImage || '/abstract-book-pattern.png'}
                                        alt={book.title}
                                        width={40}
                                        height={60}
                                        className="w-10 h-14 object-cover rounded shadow-sm group-hover:opacity-80 transition"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-foreground truncate group-hover:text-sky-600 transition">
                                        {book.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <TrendingUp size={12} className="text-green-500" />
                                        {book.score} tương tác
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
