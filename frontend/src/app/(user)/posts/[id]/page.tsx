'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useGetPostByIdQuery } from '@/features/posts/api/postApi';
import ModalPostComment from '@/components/post/ModalPostComment';
import {useGetCountQuery, useGetStatusQuery} from "@/features/likes/api/likeApi";
import {useGetCommentCountQuery} from "@/features/comments/api/commentApi";
import { useAppAuth } from '@/hooks/useAppAuth';

export default function PostModalOverlay() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { data: likeCount, isLoading: isLikeLoading } = useGetCountQuery({
        targetId: id,
        targetType: 'post',
    });

    const { isAuthenticated } = useAppAuth();

    const { data: likeStatus } = useGetStatusQuery({
        targetId: id,
        targetType: 'post',
    }, {
         skip: !isAuthenticated,
    });

    const { data: commentCount } = useGetCommentCountQuery({
        targetId: id,
        targetType: 'post',
    });
    // Gọi API để lấy thông tin bài viết
    const { data: post, isLoading } = useGetPostByIdQuery(id);

    if (isLoading || !post) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-white">Đang tải bài viết...</div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[9999]  backdrop-blur-sm
                 flex items-center justify-center"
            onClick={() => router.push("/posts")}
        >
            <div
                onClick={(e) => e.stopPropagation()}
            >
                <ModalPostComment
                    post={post}
                    isCommentOpen={true}
                    closeCommentModal={() => router.push("/posts")}
                    handleLike={() => {}}
                    commentCount={commentCount?.count}
                    likeStatus={likeStatus?.isLiked}
                    likeCount={likeCount?.count}
                />
            </div>
        </div>
    );
}
