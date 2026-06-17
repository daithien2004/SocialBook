'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { useGetTopActiveReadersQuery } from '@/features/posts/api/postApi';

export default function TopActiveReadersWidget() {
    const { data, isLoading } = useGetTopActiveReadersQuery({ days: 30, limit: 5 });
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="h-48 rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900 animate-pulse" />
        );
    }

    const topReaders = data || [];

    if (topReaders.length === 0) return null;

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Độc Giả Tích Cực
                </h2>
            </div>

            <div className="max-h-[300px] overflow-y-auto thin-scrollbar pr-1">
                <div className="space-y-4">
                    {topReaders.map((reader, index) => (
                        <div
                            key={reader.userId}
                            onClick={() => router.push(`/users/${reader.userId}/following`)}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className="relative">
                                <Image
                                    src={reader.avatar || '/abstract-book-pattern.png'}
                                    alt={reader.username}
                                    width={36}
                                    height={36}
                                    className="w-9 h-9 object-cover rounded-full border border-slate-200 dark:border-gray-700"
                                />
                                {index === 0 && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-neutral-900">
                                        1
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-foreground truncate group-hover:text-sky-600 transition">
                                    {reader.username}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Activity size={12} className="text-sky-500" />
                                    Điểm hoạt động: {reader.score}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
