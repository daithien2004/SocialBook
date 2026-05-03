'use client';

import { useEffect } from 'react';
import ModalPostComment from '@/components/post/ModalPostComment';
import { useGetPostByIdQuery } from '@/features/posts/api/postApi';
import { usePostToggleLikeMutation } from '@/features/likes/api/likeApi';
import { useParams, useRouter } from 'next/navigation';
import { useModalStore } from '@/store/useModalStore';

export default function PostModalOverlay() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { openPostComment, isPostCommentOpen } = useModalStore();

    const { data: post, isLoading } = useGetPostByIdQuery(id);
    const [toggleLike] = usePostToggleLikeMutation();

    useEffect(() => {
        if (post && !isPostCommentOpen) {
            openPostComment({
                post,
                handleLike: async (postId: string) => {
                    try {
                        await toggleLike({ targetId: postId, targetType: 'post' }).unwrap();
                    } catch (error) {
                        console.error('Failed to like post:', error);
                    }
                },
                likeStatus: post.likedByCurrentUser,
                likeCount: post.totalLikes,
            });
        }
    }, [post, openPostComment, isPostCommentOpen, toggleLike]);

    useEffect(() => {
        if (!isLoading && post && !isPostCommentOpen) {
            router.push('/posts');
        }
    }, [isPostCommentOpen, isLoading, post, router]);

    if (isLoading) {
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
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
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
             <ModalPostComment />
        </div>
    );
}
