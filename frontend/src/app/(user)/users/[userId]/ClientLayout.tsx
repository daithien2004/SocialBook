"use client"

import { ProfileHeader } from "@/src/components/user/profile-header";
import { ProfileNav } from "@/src/components/user/profile-nav";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { ReactNode, useState } from "react";
import { ProfileSidebar } from "@/src/components/user/profile-sidebar";
import { FollowStateResponse } from "@/src/features/follows/api/followApi";
import {useGetUserOverviewQuery} from "@/src/features/users/api/usersApi";
import {useRouter} from "next/navigation";

interface ClientLayoutProps {
    children: ReactNode;
    profileUserId: string;
    initialFollowState: FollowStateResponse | null;
}

export default function ClientLayout(props : ClientLayoutProps) {
    const {children, profileUserId, initialFollowState} = props
    const router = useRouter();
    const { data: overview, isLoading: isOverviewLoading } =
        useGetUserOverviewQuery(profileUserId, {
            skip: !profileUserId,
        });
    if (!overview) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy người dùng</h2>
                <button
                    onClick={() => router.push('/')}
                    className="text-blue-600 hover:underline"
                >
                    Quay lại trang chủ
                </button>
            </div>
        </div>
    )
    return (
        <div className="min-h-screen bg-gray-100">
            <ProfileHeader username={overview?.username}
                           image={overview?.image}
                           postCount = {overview?.postCount}
                           readingListCount = {overview?.readingListCount}
                           followersCount = {overview?.followersCount}
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
                            profileUserId={profileUserId}
                            joinedAt={overview?.createdAt}
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
