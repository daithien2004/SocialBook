'use client';

import ListComments from '@/features/comments/components/ListComments';
import { Separator } from '@/components/ui/separator';
import { commentQueries } from '@/features/comments/api/comment.queries';
import { useCreateComment } from '@/features/comments/api/comment.mutations';
import { useAppAuth } from '@/features/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';
import CommentInput from './CommentInput';

export interface Comment {
    id: string;
    userId: string;
    content: string;
    likesCount: number;
    createdAt: string;
    targetType: 'book' | 'chapter';
    targetId: string;
}

interface CommentSectionProps {
    targetId: string;
    targetType: 'book' | 'chapter';
    emptyMessage?: string;
    className?: string;
}

const CommentSection = memo(function CommentSection({
    targetId,
    className = '',
}: CommentSectionProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createComment = useCreateComment();

    const { data: commentCount } = useQuery({
        ...commentQueries.count({
            targetId: targetId,
            targetType: 'chapter',
        }),
    });

    const { isAuthenticated } = useAppAuth();
    const router = useRouter();

    const handleSubmit = async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        if (!isAuthenticated) {
            toast.info(MESSAGES.REQUIRE_LOGIN, {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createComment.mutateAsync({
                targetType: 'chapter',
                targetId,
                content: trimmed,
                parentId: null,
            });

        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className={`w-full mt-16 ${className}`}>
            <div className="flex items-center gap-4 mb-8">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                    Thảo luận chương ({commentCount ?? 0})
                </h3>
                <Separator className="flex-1" />
            </div>

            <div className="mb-10">
                <CommentInput
                    placeholder="Chia sẻ suy nghĩ của bạn về chương này..."
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>

            <div className="space-y-6">
                <ListComments
                    targetId={targetId}
                    isCommentOpen={true}
                    parentId={null}
                    targetType={'chapter'}
                />
            </div>
        </section>
    );
});

export default CommentSection;
