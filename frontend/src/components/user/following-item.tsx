'use client'
import { Button } from "@/components/ui/button";
import {
    FollowingUser,
    useGetFollowStatusQuery,
    useToggleFollowMutation,
    useUnfollowMutation,
} from "@/features/follows/api/followApi";
import { UserCheck, UserPlus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useModalStore } from "@/store/useModalStore";

const FollowingItem = (props: FollowingUser) => {
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
            className="
        group relative
        bg-white dark:bg-neutral-900
        rounded-xl
        border border-neutral-200 dark:border-gray-800
        shadow-md dark:shadow-none
        transition-all duration-300
        overflow-hidden flex flex-col
      "
        >
            {/* Cover Image */}
            <div className="h-24 w-full relative bg-neutral-100 dark:bg-gray-900 overflow-hidden">
                <Image
                    src="/img_1.png"
                    alt={`${props.username} cover`}
                    fill
                    className="
            object-cover transition-transform duration-700
            grayscale-[20%] group-hover:grayscale-0
          "
                />
                <div className="absolute inset-0 bg-black/0 dark:bg-black/20" />
            </div>

            {/* Content */}
            <div className="px-3 pb-2 pt-12 relative flex-1 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                    <div
                        onClick={() => {
                            closeFollowers();
                            router.push(`/users/${props.userId}`);
                        }}
                        className="
              cursor-pointer h-20 w-20 rounded-full overflow-hidden
              border-4 border-white dark:border-gray-800
              shadow-md
              bg-neutral-50 dark:bg-gray-900
            "
                    >
                        <Image
                            src={props.image || "/user.png"}
                            alt={props.username}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                {/* User Info */}
                <div className="space-y-1 mb-3">
                    <h3 className="
            font-serif font-bold text-lg
            text-slate-900 dark:text-gray-100
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
                        className="w-full rounded-md text-xs font-medium tracking-wide border-neutral-200 dark:border-gray-700 hover:bg-neutral-100 dark:hover:bg-gray-800"
                    >
                        Xem hồ sơ
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        disabled={isToggling}
                        onClick={handleToggleFollow}
                        className={`w-full rounded-md text-xs font-medium tracking-wide transition-all
                ${isFollowing
                                ? `
                      bg-primary text-primary-foreground
                      hover:bg-primary/90
                      dark:bg-primary dark:hover:bg-primary/80
                      shadow-sm
                    `
                                : `
                      bg-white dark:bg-gray-900
                      border border-neutral-200 dark:border-gray-700
                      text-slate-700 dark:text-gray-200
                      hover:bg-neutral-100 dark:hover:bg-gray-800
                    `
                            }`}
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

            {/* Stats */}
            <div
                className="
          relative z-10 mt-1 py-2
          flex justify-center text-center text-xs
          bg-green-50 dark:bg-neutral-900
          border-t border-neutral-200 dark:border-gray-800
        "
            >
                <div className="w-1/3 flex flex-col items-center">
                    <span className="font-bold text-xs text-slate-700 dark:text-gray-200">
                        {props.postCount}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-gray-400 uppercase">
                        Bài viết
                    </span>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                    <span className="font-bold text-xs text-slate-700 dark:text-gray-200">
                        {props.readingListCount}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-gray-400 uppercase">
                        Danh sách
                    </span>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                    <span className="font-bold text-xs text-slate-700 dark:text-gray-200">
                        {props.followersCount}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-gray-400 uppercase">
                        Người theo dõi
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FollowingItem;