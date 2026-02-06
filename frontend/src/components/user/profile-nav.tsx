"use client";

import { Button } from "@/src/components/ui/button";
import {
    useToggleFollowMutation,
    type FollowStateResponse,
} from "@/src/features/follows/api/followApi";
import { usersApi } from "@/src/features/users/api/usersApi";
import { cn } from "@/src/lib/utils";
import { Check, MessageSquare, Settings, UserPlus } from "lucide-react"; // Import MessageSquare
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";

import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"; // Shadcn Tabs

interface ProfileNavProps {
    profileUserId: string;
    initialFollowState: FollowStateResponse | null;
}

export function ProfileNav({ profileUserId, initialFollowState }: ProfileNavProps) {
    const segment = useSelectedLayoutSegment();
    const router = useRouter();
    const dispatch = useDispatch();

    const [followState, setFollowState] = useState<FollowStateResponse | null>(
        initialFollowState
    );

    const [toggleFollow, { isLoading: isToggling }] = useToggleFollowMutation();

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
                        { type: 'Users', id: `OVERVIEW_${profileUserId}` },
                    ])
                );
            }
        } catch (e) {
            console.log(e);
        }
    };

    // Determine the current tab value based on the segment
    const currentTab = segment === null ? "about" : segment;

    const handleTabChange = (value: string) => {
        if (value === "about") {
            router.push(`/users/${profileUserId}`);
        } else {
            router.push(`/users/${profileUserId}/${value}`);
        }
    };

    return (
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-slate-100 dark:border-gray-800">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="flex flex-col md:flex-row md:h-14 items-center justify-between gap-4 py-2 md:py-0">

                    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full md:w-auto">
                        <TabsList className="bg-transparent p-0 h-auto w-full md:w-auto flex justify-start space-x-6 overflow-x-auto no-scrollbar">
                            <TabsTrigger
                                value="about"
                                className="rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-slate-500 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:text-gray-400 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-800 dark:hover:text-gray-200 transition-none"
                            >
                                Giới thiệu
                            </TabsTrigger>
                            <TabsTrigger
                                value="posts"
                                className="rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-slate-500 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:text-gray-400 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-800 dark:hover:text-gray-200 transition-none"
                            >
                                Bài đăng
                            </TabsTrigger>
                            <TabsTrigger
                                value="following"
                                className="rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-slate-500 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:text-gray-400 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-800 dark:hover:text-gray-200 transition-none"
                            >
                                Đang theo dõi
                            </TabsTrigger>
                            <TabsTrigger
                                value="followers"
                                className="rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-slate-500 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:text-gray-400 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-800 dark:hover:text-gray-200 transition-none"
                            >
                                Người theo dõi
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 pb-2 md:pb-0">
                        {isAuthenticated && isOwner ? (
                            <Button
                                onClick={() => router.push(`/users/${profileUserId}/profile`)}
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Sửa hồ sơ
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant={isFollowing ? "outline" : "default"}
                                    size="sm"
                                    onClick={handleFollowClick}
                                    disabled={isToggling}
                                    className={cn("h-9 gap-2 min-w-[120px]",
                                        !isFollowing && "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    )}
                                >
                                    {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                    {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                                </Button>
                                {/* Added Message Button for non-owners */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    title="Nhắn tin"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
