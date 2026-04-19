import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface UsePostCommentsOptions {
    postId: string;
    createComment: (params: {
        targetType: string;
        targetId: string;
        content: string;
        parentId: string | null;
    }) => Promise<void>;
}

export interface UsePostCommentsResult {
    commentText: string;
    isSubmitting: boolean;
    commentInputRef: React.RefObject<HTMLInputElement | null>;
    setCommentText: (text: string) => void;
    handleSubmitComment: () => Promise<void>;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function usePostComments({ postId, createComment }: UsePostCommentsOptions): UsePostCommentsResult {
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCommentText('');
    }, [postId]);

    const handleSubmitComment = useCallback(async () => {
        const content = commentText.trim();
        if (!content) return;

        try {
            setIsSubmitting(true);
            await createComment({
                targetType: 'post',
                targetId: postId,
                content,
                parentId: null,
            });
            setCommentText('');
            toast.success('Bình luận đã được gửi!');
            setTimeout(() => commentInputRef.current?.focus(), 0);
        } catch (e: any) {
            console.error('Create comment failed:', e);
            toast.error(getErrorMessage(e));
        } finally {
            setIsSubmitting(false);
        }
    }, [commentText, postId, createComment]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    }, [handleSubmitComment]);

    return {
        commentText,
        isSubmitting,
        commentInputRef,
        setCommentText,
        handleSubmitComment,
        handleKeyDown,
    };
}
