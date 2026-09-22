'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MESSAGES } from '@/constants/messages';
import { useToggleFollow, useUnfollow } from '@/features/follows/api/follows.mutations';
import { followQueries } from '@/features/follows/api/follows.queries';
import { useAppAuth } from '@/features/auth/hooks/useAppAuth';

interface UseFollowUserOptions {
    userId: string;
    initialIsFollowing?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export function useFollowUser({ userId, initialIsFollowing = false, onFollowChange }: UseFollowUserOptions) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const auth = useAppAuth();
    const router = useRouter();
    
    const { data: statusData } = useQuery({
        ...followQueries.status(userId),
        enabled: !!userId && !!auth?.isAuthenticated && auth?.user?.id !== userId,
    });

    useEffect(() => {
        if (statusData) {
            queueMicrotask(() => {
                setIsFollowing(statusData.isFollowing);
            });
        }
    }, [statusData]);

    const toggleFollowMutation = useToggleFollow();
    const unfollowMutation = useUnfollow();
    const isLoading = toggleFollowMutation.isPending || unfollowMutation.isPending;

    const handleToggle = useCallback(async () => {
        if (!auth?.isAuthenticated) {
            toast.info(MESSAGES.REQUIRE_LOGIN, {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }
        try {
            if (isFollowing) {
                await unfollowMutation.mutateAsync(userId);
            } else {
                await toggleFollowMutation.mutateAsync(userId);
            }
            const newState = !isFollowing;
            setIsFollowing(newState);
            onFollowChange?.(newState);
        } catch {
            toast.error(MESSAGES.FOLLOW_TOGGLE_FAILED);
        }
    }, [isFollowing, userId, toggleFollowMutation, unfollowMutation, onFollowChange, auth?.isAuthenticated, router]);

    return {
        isFollowing,
        isLoading,
        toggleFollow: handleToggle,
    };
}
