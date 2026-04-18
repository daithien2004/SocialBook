'use client';

import ModalPostComment from '@/components/post/ModalPostComment';
import { useGetPostByIdQuery } from '@/features/posts/api/postApi';
import { useParams, useRouter } from 'next/navigation';

export default function PostModalOverlay() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const { data: post, isLoading } = useGetPostByIdQuery(id);

    if (isLoading || !post) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-white">Dang tai bai viet...</div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
            onClick={() => router.push('/posts')}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <ModalPostComment />
            </div>
        </div>
    );
}
