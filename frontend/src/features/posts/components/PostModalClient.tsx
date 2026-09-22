'use client';

import { useQuery } from '@tanstack/react-query';
import ModalPostComment from '@/features/posts/components/ModalPostComment';
import { postQueries } from '@/features/posts/api/post.queries';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/features/auth/hooks';

export function PostModalClient({ id }: { id: string }) {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAppAuth();
    
    const { data: post, isLoading } = useQuery({
        ...postQueries.detail({ id, userId: user?.id }),
        enabled: !isAuthLoading,
    });

    const showLoading = isAuthLoading || isLoading;

    if (showLoading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <div className="text-white font-medium">Đang tải bài viết...</div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-card p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
                    <div className="text-4xl">😕</div>
                    <h2 className="text-xl font-bold">Không tìm thấy bài viết</h2>
                    <p className="text-muted-foreground">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
                    <button
                        onClick={() => router.push('/posts')}
                        className="w-full py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors"
                    >
                        Quay lại Bảng tin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            <div className="pointer-events-auto">
                <ModalPostComment 
                    postData={post} 
                    isOpenOverride={true} 
                    onCloseOverride={() => router.push('/posts')} 
                />
            </div>
        </div>
    );
}
