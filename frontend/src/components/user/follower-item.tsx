import { Button } from "@/src/components/ui/button";
import {
    FollowingUser,
    useToggleFollowMutation,
} from "@/src/features/follows/api/followApi";
import { RootState } from "@/src/store/store";
import { UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

const FollowerItem = (props: FollowingUser) => {
    const auth = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(
        props.isFollowedByCurrentUser
    );
    const route = useRouter();
    const [toggleFollow, { isLoading: isToggling }] =
        useToggleFollowMutation();

    const handleToggleFollow = async () => {
        try {
            await toggleFollow(props.id).unwrap();
            setIsFollowing((prev) => !prev);
        } catch (e: any) {
            console.log("Toggle follow failed:", e);
        }
    };

    return (
        <div
            className="
        flex items-center justify-between gap-3
        rounded-xl px-2 py-2
        hover:bg-slate-50 dark:hover:bg-gray-800/60
        transition-colors
      "
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <img
                    src={props.image}
                    alt={props.username}
                    onClick={() => {
                        route.push(`/users/${props.id}`)
                    }}
                    className="h-10 w-10 rounded-full object-cover
            border border-slate-200 dark:border-gray-700 cursor-pointer"
                />

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
            {props.id === auth?.user?.id ? (
                <Button
                    variant="ghost"
                    disabled={isToggling}
                    onClick={() => router.push(`/users/${props.id}`)}
                    className="
            rounded-md text-xs font-medium tracking-wide
            bg-teal-600 text-white
            hover:bg-teal-500
            dark:bg-teal-700 dark:hover:bg-teal-600
            shadow-sm
          "
                >
                    Xem hồ sơ
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    disabled={isToggling}
                    onClick={handleToggleFollow}
                    className={`rounded-md text-xs font-medium tracking-wide
            transition-all
            ${isFollowing
                            ? `
                  bg-teal-600 text-white
                  hover:bg-teal-500
                  dark:bg-teal-700 dark:hover:bg-teal-600
                  shadow-sm
                `
                            : `
                  bg-white dark:bg-gray-900
                  border border-slate-200 dark:border-gray-700
                  text-slate-700 dark:text-gray-200
                  hover:bg-slate-100 dark:hover:bg-gray-800
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
    );
};

export default FollowerItem;
