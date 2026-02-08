'use client';

import { BookStats } from '@/features/admin/types/dashboard.types';
import { Eye, ThumbsUp } from 'lucide-react';
import Link from 'next/link';

interface PopularBooksTableProps {
    books: BookStats['popularBooks'];
}

export function PopularBooksTable({ books }: PopularBooksTableProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sách Phổ Biến</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 ps-2">
                                Tựa sách
                            </th>
                            <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                                Lượt xem
                            </th>
                            <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                                Lượt thích
                            </th>
                            <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 pe-2">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {books.slice(0, 5).map((book) => (
                            <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <td className="py-3 ps-2">
                                    <div className="flex items-center">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {book.title}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                                        <Eye className="w-4 h-4 mr-1.5 text-blue-500" />
                                        {book.views.toLocaleString()}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                                        <ThumbsUp className="w-4 h-4 mr-1.5 text-pink-500" />
                                        {book.likes.toLocaleString()}
                                    </div>
                                </td>
                                <td className="py-3 pl-11 text-center">
                                    <Link
                                        href={`/books/${book.slug}`}
                                        target="_blank"
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium"
                                    >
                                        Xem
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
