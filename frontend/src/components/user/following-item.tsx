import { Button } from "@/components/ui/button";
import { FollowingUser } from "@/features/follows/api/followApi";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/features/auth/hooks/useAppAuth";
import { useModalStore } from "@/store/useModalStore";
import { UserAvatar } from "@/components/common/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import Image from "next/image";

const FollowingItem = (props: FollowingUser) => {
    const auth = useAppAuth();
    const router = useRouter();
    const { closeFollowers } = useModalStore();

    return (
        <div
            className="
                        group relative
                        bg-white dark:bg-neutral-900
                        rounded-xl
                        border border-border
                        shadow-md dark:shadow-none
                        transition-all duration-300
                        overflow-hidden flex flex-col
                    "
        >
            {/* Cover Image */}
            <div className="h-24 w-full relative bg-secondary overflow-hidden">
                <Image
                    src="/img_1.png"
                    alt={`${props.username} cover`}
                    fill
                    className=" object-cover transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-black/0 dark:bg-black/20" />
            </div>

            {/* Content */}
            <div className="px-3 pb-2 pt-12 relative flex-1 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                    <UserAvatar
                        src={props.image}
                        name={props.username}
                        onClick={() => {
                            closeFollowers();
                            router.push(`/users/${props.targetId}`);
                        }}
                        className="h-20 w-20 border-4 border-white dark:border-gray-800 shadow-md bg-card"
                    />
                </div>

                {/* User Info */}
                <div className="space-y-1 mb-3">
                    <h3 className="
                        font-serif font-bold text-lg
                        text-foreground
                        group-hover:text-neutral-700 dark:group-hover:text-gray-200
                        transition-colors
                    ">
                        {props.username}
                    </h3>
                </div>

                {/* Follow Button / Profile Button */}
                {props.targetId === auth?.user?.id ? (
                    <Button
                        variant="outline"
                        onClick={() => {
                            closeFollowers();
                            router.push(`/users/${props.userId}`);
                        }}
                        className="w-full rounded-md text-xs font-medium tracking-wide border-border hover:bg-secondary"
                    >
                        Xem hồ sơ
                    </Button>
                ) : (
                    <FollowButton
                        userId={props.targetId}
                        initialIsFollowing={props.isFollowedByCurrentUser}
                        size="sm"
                        className="w-full rounded-md text-xs font-medium tracking-wide shadow-sm"
                    />
                )}
            </div>

            {/* Stats */}
            <div
                className="relative z-10 mt-1 p-1 grid grid-cols-3 w-full text-center text-xs 
                        bg-green-50 dark:bg-neutral-900 border-t border-border"
            >
                <div className="flex flex-col items-center">
                    <span className="font-bold text-xs text-foreground">
                        {props.postCount}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase">
                        Bài viết
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="font-bold text-xs text-foreground">
                        {props.readingListCount}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase">
                        Danh sách
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="font-bold text-xs text-foreground">
                        {props.followersCount}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase">
                        Người theo dõi
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FollowingItem;