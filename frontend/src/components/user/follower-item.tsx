import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    FollowingUser,
    useGetFollowStatusQuery,
    useToggleFollowMutation,
    useUnfollowMutation,
} from "@/features/follows/api/followApi";
import { RootState } from "@/store/store";
import { UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/store/useModalStore";

const FollowerItem = (props: FollowingUser) => {
    const auth = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const { closeFollowers } = useModalStore();
    
    const [isFollowing, setIsFollowing] = useState(props.isFollowedByCurrentUser);

    const { data: statusData } = useGetFollowStatusQuery(props.userId, {
        skip: !auth.isAuthenticated || auth?.user?.id === props.userId,
    });

    useEffect(() => {
        if (statusData) {
            setIsFollowing(statusData.isFollowing);
        }
    }, [statusData]);

    const [toggleFollow, { isLoading: isFollowLoading }] = useToggleFollowMutation();
    const [unfollow, { isLoading: isUnfollowLoading }] = useUnfollowMutation();
    const isToggling = isFollowLoading || isUnfollowLoading;

    const handleToggleFollow = async () => {
        try {
            if (isFollowing) {
                await unfollow(props.userId).unwrap();
            } else {
                await toggleFollow(props.userId).unwrap();
            }
            setIsFollowing((prev) => !prev);
        } catch (e: any) {
            console.log("Toggle follow failed:", e);
        }
    };

    return (
        <div
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-gray-800/60"
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <div
                    onClick={() => {
                        closeFollowers();
                        router.push(`/users/${props.userId}`)
                    }}
                    className="relative h-10 w-10 overflow-hidden rounded-full cursor-pointer border border-slate-200 dark:border-gray-700"
                >
                    <Image
                        src={props.image || '/user.png'}
                        alt={props.username}
                        fill
                        sizes="40px"
                        className="object-cover"
                    />
                </div>

                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-gray-100">
                        {props.username}
                    </span>

                    <span className="text-xs text-slate-500 dark:text-gray-400">
                        {props.readingListCount > 0 &&
                            `${props.readingListCount} Danh sách đọc`}
                        {props.readingListCount > 0 &&
                            props.followersCount > 0 &&
                            " • "}
                        {props.followersCount > 0 &&
                            `Người theo dõi ${props.followersCount}`}
                    </span>
                </div>
            </div>

            {/* Right */}
            {props.userId === auth?.user?.id ? (
                <Button
                    variant="ghost"
                    disabled={isToggling}
                    onClick={() => {
                        closeFollowers();
                        router.push(`/users/${props.userId}`);
                    }}
                    className="rounded-md text-xs font-medium tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                    Xem hồ sơ
                </Button>
            ) : (
                <Button
                    variant={isFollowing ? "default" : "outline"}
                    disabled={isToggling}
                    onClick={handleToggleFollow}
                    className={cn(
                        "rounded-md text-xs font-medium tracking-wide transition-all shadow-sm",
                        isFollowing
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-accent",
                    )}
                >
                    {isFollowing ? (
                        <>
                            <UserCheck className="mr-2 h-3.5 w-3.5" />
                            Đang theo dõi
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 h-3.5 w-3.5" />
                            Theo dõi
                        </>
                    )}
                </Button>
            )}
        </div>
    );
};

export default FollowerItem;
