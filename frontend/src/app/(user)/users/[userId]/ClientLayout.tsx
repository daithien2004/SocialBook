"use client"

import { ProfileHeader } from "@/features/users/components/profile-header";
import { ProfileNav } from "@/features/users/components/profile-nav";
import React, { ReactNode } from "react";
import { ProfileSidebar } from "@/features/users/components/profile-sidebar";
import { useQuery } from "@tanstack/react-query";
import { FollowStateResponse } from "@/features/follows/types/follow.interface";
import { userQueries } from "@/features/users/api/users.queries";

interface ClientLayoutProps {
    children: ReactNode;
    profileUserId: string;
    initialFollowState: FollowStateResponse | null;
}

export default function ClientLayout(props: ClientLayoutProps) {
    const { children, profileUserId, initialFollowState } = props
    const { data: overview } =
        useQuery({
            ...userQueries.overview(profileUserId),
            enabled: !!profileUserId,
        });
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <ProfileHeader username={overview?.username}
                image={overview?.image}
                postCount={overview?.postCount}
                readingListCount={overview?.readingListCount}
                followersCount={overview?.followersCount}
                profileUserId={profileUserId}
            />

            <ProfileNav
                profileUserId={profileUserId}
                initialFollowState={initialFollowState}
            />

            <main className="container mx-auto max-w-6xl px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-2/6">
                        <ProfileSidebar
                            bio={overview?.bio}
                            profileUserId={profileUserId}
                            joinedAt={overview?.createdAt}
                            location={overview?.location}
                            website={overview?.website}
                        />
                    </div>
                    <div className="w-full lg:w-4/6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
