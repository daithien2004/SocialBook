'use client';

import { useEffect, useState } from 'react';
import {
    useLazyGetCommentsByTargetQuery,
} from '@/features/comments/api/commentApi';
import { CommentItem } from '@/features/comments/types/comment.interface';

interface UseCommentListOptions {
    targetId: string;
    isCommentOpen: boolean;
    parentId: string | null;
    limit?: number;
}

export function useCommentList({ targetId, isCommentOpen, parentId, limit = 20 }: UseCommentListOptions) {
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [allComments, setAllComments] = useState<CommentItem[]>([]);

    const [
        fetchComments,
        { data, isLoading, isError, isFetching, isUninitialized },
    ] = useLazyGetCommentsByTargetQuery();

    const isFirstLoading = isLoading || (isFetching && isUninitialized);

    useEffect(() => {
        if (!isCommentOpen) return;
        if (isCommentOpen && targetId) {
            setAllComments([]);
            setCursor(undefined);
            fetchComments({ targetId, parentId, limit });
        }
    }, [isCommentOpen, targetId, parentId, limit, fetchComments]);

    useEffect(() => {
        if (data?.comments) {
            setAllComments(data.comments);
            setCursor(data.nextCursor ?? undefined);
        }
    }, [data]);

    const handleLoadMore = () => {
        if (cursor && targetId) {
            fetchComments({ targetId, parentId, cursor, limit });
        }
    };

    return {
        comments: allComments,
        isLoading: isFirstLoading,
        isError,
        isFetching,
        hasMore: data?.hasMore ?? false,
        cursor,
        loadMore: handleLoadMore,
    };
}
