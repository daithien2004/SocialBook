'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MESSAGES } from '@/constants/messages';
import { useToggleFollowMutation, useUnfollowMutation, useGetFollowStatusQuery } from '@/features/follows/api/followApi';
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
    
    const { data: statusData } = useGetFollowStatusQuery(userId, {
        skip: !auth?.isAuthenticated || auth?.user?.id === userId || !userId,
    });

    useEffect(() => {
        if (statusData) {
            queueMicrotask(() => {
                setIsFollowing(statusData.isFollowing);
            });
        }
    }, [statusData]);

    const [toggleFollow, { isLoading: isFollowLoading }] = useToggleFollowMutation();
    const [unfollow, { isLoading: isUnfollowLoading }] = useUnfollowMutation();
    const isLoading = isFollowLoading || isUnfollowLoading;

    const handleToggle = useCallback(async () => {
        if (!auth?.isAuthenticated) {
            toast.info(MESSAGES.REQUIRE_LOGIN, {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }
        try {
            if (isFollowing) {
                await unfollow(userId).unwrap();
            } else {
                await toggleFollow(userId).unwrap();
            }
            const newState = !isFollowing;
            setIsFollowing(newState);
            onFollowChange?.(newState);
        } catch {
            toast.error(MESSAGES.FOLLOW_TOGGLE_FAILED);
        }
    }, [isFollowing, userId, toggleFollow, unfollow, onFollowChange, auth?.isAuthenticated, router]);

    return {
        isFollowing,
        isLoading,
        toggleFollow: handleToggle,
    };
}
