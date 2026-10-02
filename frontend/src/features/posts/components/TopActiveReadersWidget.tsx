'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Activity, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { postQueries } from '@/features/posts/api/post.queries';

export default function TopActiveReadersWidget() {
    const { data, isLoading } = useQuery({
        ...postQueries.topReaders({ days: 30, limit: 5 }),
    });
    const router = useRouter();

    if (isLoading) {
        return (
            <Skeleton className="h-48 rounded-2xl w-full" />
        );
    }

    const topReaders = data || [];

    return (
        <div className="bg-card text-card-foreground rounded-2xl shadow-md border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Độc Giả Tích Cực
                </h2>
            </div>

            <div className="max-h-[300px] overflow-y-auto thin-scrollbar pr-1 pt-1">
                {topReaders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-muted/50 rounded-xl border border-dashed border-border mt-2">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm border border-border">
                            <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Chưa có độc giả</p>
                        <p className="text-xs text-muted-foreground mt-1">
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
                                        className="w-9 h-9 object-cover rounded-full border border-border"
                                    />
                                    {index === 0 && (
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold border-2 border-background shadow-sm">
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
