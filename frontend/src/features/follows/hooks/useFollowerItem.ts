import {
    useGetFollowStatusQuery,
    useToggleFollowMutation,
    useUnfollowMutation,
} from '@/features/follows/api/followApi';
import { RootState } from '@/store/store';
import { useModalStore } from '@/store/useModalStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

interface UseFollowerItemOptions {
    userId: string;
    isFollowedByCurrentUser: boolean;
}

export const useFollowerItem = ({
    userId,
    isFollowedByCurrentUser,
}: UseFollowerItemOptions) => {
    const auth = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const { closeFollowers } = useModalStore();

    const [isFollowing, setIsFollowing] = useState(isFollowedByCurrentUser);

    const { data: statusData } = useGetFollowStatusQuery(userId, {
        skip: !auth.isAuthenticated || auth?.user?.id === userId,
    });

    useEffect(() => {
        if (statusData) {
            setIsFollowing(statusData.isFollowing);
        }
    }, [statusData]);

    const [toggleFollow, { isLoading: isFollowLoading }] =
        useToggleFollowMutation();
    const [unfollow, { isLoading: isUnfollowLoading }] = useUnfollowMutation();

    const isToggling = isFollowLoading || isUnfollowLoading;
    const isCurrentUser = auth?.user?.id === userId;

    const handleToggleFollow = async () => {
        try {
            if (isFollowing) {
                await unfollow(userId).unwrap();
            } else {
                await toggleFollow(userId).unwrap();
            }
            setIsFollowing((prev) => !prev);
        } catch (e) {
            console.log('Toggle follow failed:', e);
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
