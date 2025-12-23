'use client';

import {useAppAuth} from '@/src/hooks/useAppAuth';
import {useGetPersonalizedRecommendationsQuery} from '@/src/features/recommendations/api/recommendationsApi';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useGetBooksQuery} from "@/src/features/books/api/bookApi";
import {PAGINATION} from "@/src/features/books/books.constants";

export default function RecommendedBooks() {
    const {isAuthenticated} = useAppAuth();
    const router = useRouter();

    const limit = 12;

    const {data, isLoading, error} = useGetPersonalizedRecommendationsQuery(
        {page: 1, limit},
        {skip: !isAuthenticated}
    );

    const {data: dataBook, isLoading: isLoadingBook, isFetching} = useGetBooksQuery({
        page: 1,
        limit: PAGINATION.BOOKS_PER_PAGE,
        sortBy: 'views',
    });

    const loading = isAuthenticated ? isLoading : isLoadingBook;

    if (loading) {
        return (
            <div
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-gray-800">
                    <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                        {isAuthenticated ? 'Bạn cũng có thể thích' : 'Sách được xem nhiều'}
                    </h2>
                </div>

                <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-20 h-28 bg-slate-200 dark:bg-white/5 rounded-lg"/>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4"/>
                                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2"/>
                                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-full"/>
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
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-4">
                <p className="text-sm text-red-500">
                    Không thể tải danh sách gợi ý
                </p>
            </div>
        );
    }


    const booksToRender = isAuthenticated
        ? data?.recommendations || []
        : dataBook?.data || [];

    if (!booksToRender.length) {
        return (
            <div
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-4">
                <p className="text-sm text-slate-500 dark:text-gray-400">
                    Chưa có sách để hiển thị
                </p>
            </div>
        );
    }

    return (
        <div
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-gray-800">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    {isAuthenticated ? 'Bạn cũng có thể thích' : 'Sách được xem nhiều'}
                </h2>
            </div>

            {/* Book list */}
            <div className="max-h-[600px] overflow-y-auto thin-scrollbar">
                {booksToRender.map((item: any) => {
                    const book = isAuthenticated ? item.book : item;

                    return (
                        <div
                            key={book.id}
                            onClick={() => router.push(`/books/${book.slug}`)}
                            className="px-4 py-2 border-b border-slate-50 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex gap-3">
                                {/* Cover */}
                                <div
                                    className="relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow">
                                    {book.coverUrl ? (
                                        <Image
                                            src={book.coverUrl}
                                            alt={book.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-gray-700"/>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 line-clamp-2 mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        {book.title}
                                    </h3>

                                    <div className="text-xs text-slate-500 dark:text-gray-400 mb-1.5">
                                        {book.authorId?.name || 'Unknown Author'}
                                    </div>

                                    {/* CHỈ HIỂN THỊ KHI ĐÃ LOGIN */}
                                    {isAuthenticated && item.matchScore && (
                                        <span
                                            className="inline-block mb-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                            Phù hợp {item.matchScore}%
                                        </span>
                                    )}

                                    {isAuthenticated && item.reason && (
                                        <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                            {item.reason}
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
