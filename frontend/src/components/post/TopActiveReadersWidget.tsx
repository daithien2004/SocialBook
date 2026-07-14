'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Activity, Users } from 'lucide-react';
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

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Độc Giả Tích Cực
                </h2>
            </div>

            <div className="max-h-[300px] overflow-y-auto thin-scrollbar pr-1 pt-1">
                {topReaders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 mt-2">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center mb-3 shadow-sm border border-slate-100 dark:border-neutral-800">
                            <Users className="w-6 h-6 text-slate-300 dark:text-neutral-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">Chưa có độc giả</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
                            Hãy tương tác để trở thành độc giả tích cực đầu tiên!
                        </p>
                    </div>
                ) : (
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
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold border-2 border-white dark:border-neutral-900 shadow-sm">
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
                )}
            </div>
        </div>
    );
}
