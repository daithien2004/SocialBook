"use client"

import { ProfileHeader } from "@/src/components/user/profile-header";
import { ProfileNav } from "@/src/components/user/profile-nav";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { ReactNode } from "react";
import { ProfileSidebar } from "@/src/components/user/profile-sidebar";
import { FollowStateResponse } from "@/src/features/follows/api/followApi";

interface ClientLayoutProps {
    children: ReactNode;
    profileUserId: string;
    initialFollowState: FollowStateResponse | null;
}

export default function ClientLayout(props : ClientLayoutProps) {
    const {children, profileUserId, initialFollowState} = props
    const auth = useSelector((state: RootState) => state.auth);

    return (
        <div className="min-h-screen bg-gray-100">
            <ProfileHeader username={auth?.user?.username} />

            <ProfileNav
                profileUserId={profileUserId}
                initialFollowState={initialFollowState}
            />

            <main className="container mx-auto max-w-6xl px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-[35%]">
                        <ProfileSidebar />
                    </div>
                    <div className="w-full lg:w-[65%]">{children}</div>
                </div>
            </main>
        </div>
    );
}
