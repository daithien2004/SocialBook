import { Button } from '@/components/ui/button';
import { FollowingUser } from '@/features/follows/api/followApi';
import { useFollowerItem } from '@/features/follows/hooks/useFollowerItem';
import { UserAvatar } from '@/components/common/UserAvatar';
import { FollowButton } from '@/components/user/FollowButton';
import { memo } from 'react';

const FollowerItem = memo(function FollowerItem(props: FollowingUser) {
    const {
        isCurrentUser,
        isToggling,
        handleNavigateToProfile,
    } = useFollowerItem({
        userId: props.userId,
        isFollowedByCurrentUser: props.isFollowedByCurrentUser,
    });

    return (
        <div
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent"
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <UserAvatar
                    src={props.image}
                    name={props.username}
                    size="md"
                    onClick={handleNavigateToProfile}
                    className="border border-border"
                />

                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                        {props.username}
                    </span>

                    <span className="text-xs text-muted-foreground">
                        {props.readingListCount > 0 &&
                            `${props.readingListCount} Danh sách đọc`}
                        {props.readingListCount > 0 &&
                            props.followersCount > 0 &&
                            ' • '}
                        {props.followersCount > 0 &&
                            `Người theo dõi ${props.followersCount}`}
                    </span>
                </div>
            </div>

            {/* Right */}
            {isCurrentUser ? (
                <Button
                    variant="ghost"
                    disabled={isToggling}
                    onClick={handleNavigateToProfile}
                    className="rounded-md text-xs font-medium tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                    Xem hồ sơ
                </Button>
            ) : (
                <FollowButton
                    userId={props.userId}
                    initialIsFollowing={props.isFollowedByCurrentUser}
                    size="sm"
                    className="rounded-md shadow-sm"
                />
            )}
        </div>
    );
});

export default FollowerItem;
