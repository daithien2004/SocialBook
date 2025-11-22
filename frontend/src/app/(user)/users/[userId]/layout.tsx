// ClientLayout.tsx
"use client"

import { ProfileHeader } from "@/src/components/user/profile-header";
import { ProfileNav } from "@/src/components/user/profile-nav";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useParams } from "next/navigation";
import { ReactNode } from "react";
import { ProfileSidebar } from "@/src/components/user/profile-sidebar";

export default function ClientLayout({ children }: { children: ReactNode }) {
    const params = useParams() as { userId: string };
    const auth = useSelector((state: RootState) => state.auth);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* hiện tại vẫn dùng username của auth (user đăng nhập) */}
            <ProfileHeader username={auth?.user?.username} />

            {/* chỉ cần truyền profileUserId, không truyền isOwner nữa */}
            <ProfileNav profileUserId={params.userId} />

            <main className="container mx-auto max-w-6xl px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-[35%]">
                        <ProfileSidebar />
                    </div>
                    <div className="w-full lg:w-[65%]">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
