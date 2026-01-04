"use client";

import {Ellipsis, Settings, UserPlus} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useSelectedLayoutSegment, useRouter} from "next/navigation";
import {
    useToggleFollowMutation,
    type FollowStateResponse,
} from "@/src/features/follows/api/followApi";
import {useState} from "react";
import {useDispatch} from "react-redux";
import {usersApi} from "@/src/features/users/api/usersApi";

interface ProfileNavProps {
    profileUserId: string;
    initialFollowState: FollowStateResponse | null;
}

export function ProfileNav({profileUserId, initialFollowState}: ProfileNavProps) {
    const segment = useSelectedLayoutSegment();
    const router = useRouter();
    const dispatch = useDispatch();

    const [followState, setFollowState] = useState<FollowStateResponse | null>(
        initialFollowState
    );

    const [toggleFollow, {isLoading: isToggling}] = useToggleFollowMutation();

    const isAuthenticated = !!followState;
    const isOwner = followState?.isOwner === true;
    const isFollowing = followState?.isFollowing === true;

    const handleFollowClick = async () => {
        try {
            const result = await toggleFollow(profileUserId);

            if ('data' in result) {
                setFollowState((prev) =>
                    prev
                        ? {
                            ...prev,
                            isFollowing: !prev.isFollowing,
                        }
                        : prev
                );
                dispatch(
                    usersApi.util.invalidateTags([
                        {type: 'Users', id: `OVERVIEW_${profileUserId}`},
                    ])
                );
            }
        } catch (e) {
            console.log(e);
        }
    };

    const tabs = [
        {label: "Giới thiệu", href: `/users/${profileUserId}`, segment: null},
        {label: "Bài đăng", href: `/users/${profileUserId}/posts`, segment: "posts"},
        {label: "Đang theo dõi", href: `/users/${profileUserId}/following`, segment: "following"},
    ];

    return (
        <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-slate-100 dark:border-gray-800">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="flex flex-col md:flex-row md:h-14 items-center justify-between">
                    <nav className="flex w-full md:w-auto overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            const isActive =
                                segment === tab.segment ||
                                (segment === null && tab.segment === null);

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={[
                                        "px-4 py-3 text-base font-serif whitespace-nowrap border-b-4 transition-colors",
                                        isActive
                                            ? "border-[#ff9800] text-slate-900 dark:text-gray-100"
                                            : "border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200",
                                    ].join(" ")}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="py-2 md:py-0">
                        {isAuthenticated && isOwner ? (
                            <Button
                                onClick={() => router.push(`/users/${profileUserId}/profile`)}
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 text-sm font-semibold
                text-slate-700 dark:text-gray-200
                bg-white dark:bg-gray-900
                border-slate-200 dark:border-gray-700
                hover:bg-slate-100 dark:hover:bg-gray-800"
                            >
                                <Settings className="h-5 w-5"/>
                                Sửa hồ sơ
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFollowClick}
                                    disabled={isToggling}
                                    className="h-9 gap-2 text-sm font-semibold
                  text-slate-700 dark:text-gray-200
                  bg-slate-50 dark:bg-gray-900
                  border-slate-200 dark:border-gray-700
                  hover:bg-slate-100 dark:hover:bg-gray-800"
                                >
                                    <UserPlus className="h-4 w-4"/>
                                    {isAuthenticated && isFollowing ? "Đang theo dõi" : "Theo dõi"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
