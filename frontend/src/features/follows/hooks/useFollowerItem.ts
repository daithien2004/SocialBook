'use client';

import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { MESSAGES } from '@/constants/messages';
import { useToggleFollow, useUnfollow } from '@/features/follows/api/follows.mutations';
import { followQueries } from '@/features/follows/api/follows.queries';
import { useAppAuth } from '@/features/auth/hooks/useAppAuth';
import { useModalStore } from '@/store/useModalStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UseFollowerItemOptions {
    userId: string;
    isFollowedByCurrentUser?: boolean;
}

export const useFollowerItem = ({
    userId,
    isFollowedByCurrentUser = false,
}: UseFollowerItemOptions) => {
    const auth = useAppAuth();
    const router = useRouter();
    const { closeFollowers } = useModalStore();

    const [isFollowing, setIsFollowing] = useState(isFollowedByCurrentUser);

    const { data: statusData } = useQuery({
        ...followQueries.status(userId),
        enabled: !!userId && auth.isAuthenticated && auth?.user?.id !== userId,
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

    const isToggling =
        toggleFollowMutation.isPending || unfollowMutation.isPending;
    const isCurrentUser = auth?.user?.id === userId;

    const handleToggleFollow = async () => {
        try {
            if (isFollowing) {
                await unfollowMutation.mutateAsync(userId);
            } else {
                await toggleFollowMutation.mutateAsync(userId);
            }
            setIsFollowing((prev) => !prev);
        } catch {
            toast.error(MESSAGES.FOLLOW_TOGGLE_FAILED);
        }
    };

    const handleNavigateToProfile = () => {
        closeFollowers();
        router.push(`/users/${userId}`);
    };

    return {
        isFollowing,
        isToggling,
        isCurrentUser,
        handleToggleFollow,
        handleNavigateToProfile,
    };
};
