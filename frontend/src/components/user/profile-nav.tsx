"use client";

import { Button } from "@/components/ui/button";
import { type FollowStateResponse } from "@/features/follows/api/followApi";
import { usersApi } from "@/features/users/api/usersApi";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { FollowButton } from "@/components/user/FollowButton";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Shadcn Tabs

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

    const isAuthenticated = !!followState;
    const isOwner = followState?.isOwner === true;
    const isFollowing = followState?.isFollowing === true;

    const currentTab = segment === null ? "about" : segment;

    const handleTabChange = (value: string) => {
        if (value === "about") {
            router.push(`/users/${profileUserId}`);
        } else {
            router.push(`/users/${profileUserId}/${value}`);
        }
    };

    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="flex flex-col md:flex-row md:h-14 items-center justify-between gap-4 py-2 md:py-0">

                    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full md:w-auto">
                        <TabsList variant="underline">
                            <TabsTrigger value="about" variant="underline">
                                Giới thiệu
                            </TabsTrigger>
                            <TabsTrigger value="posts" variant="underline">
                                Bài đăng
                            </TabsTrigger>
                            <TabsTrigger value="following" variant="underline">
                                Đang theo dõi
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
                                <FollowButton
                                    userId={profileUserId}
                                    initialIsFollowing={isFollowing}
                                    size="sm"
                                    className={cn("h-9 min-w-[120px]",
                                        !isFollowing && "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    )}
                                    onFollowChange={(newIsFollowing) => {
                                        setFollowState((prev) =>
                                            prev ? { ...prev, isFollowing: newIsFollowing } : prev
                                        );
                                        dispatch(
                                            usersApi.util.invalidateTags([
                                                { type: 'Users', id: `OVERVIEW_${profileUserId}` },
                                            ])
                                        );
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
