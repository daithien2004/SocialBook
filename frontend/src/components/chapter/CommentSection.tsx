'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/src/lib/utils';
import CommentInput from './CommentInput';
import ListComments from '@/src/components/comment/ListComments';
import { useGetCommentCountQuery, usePostCreateMutation } from '@/src/features/comments/api/commentApi';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/src/hooks/useAppAuth';

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

export default function CommentSection({
    targetId,
    className = '',
}: CommentSectionProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createComment] = usePostCreateMutation();
    const { theme, setTheme } = useTheme();

    const { data: commentCount } = useGetCommentCountQuery({
        targetId: targetId,
        targetType: 'chapter',
    });

    const { isAuthenticated } = useAppAuth();
    const router = useRouter();

    const handleSubmit = async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để bình luận', {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createComment({
                targetType: 'chapter',
                targetId,
                content: trimmed,
                parentId: null,
            }).unwrap();

            toast.success('Bình luận đã được gửi!');
        } catch (error: any) {
            console.log('Failed to submit comment:', error);
            if (error?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className={`w-full mt-16 ${className}`}>
            <div className="flex items-center gap-4 mb-8">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    Thảo luận chương ({commentCount?.count ?? 0})
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-white/10" />
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
                    theme={theme as 'light' | 'dark' | undefined}
                />
            </div>
        </section>
    );
}
