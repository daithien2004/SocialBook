'use client'

import {ProfileHeader} from "@/src/components/user/profile-header";
import {ProfileNav} from "@/src/components/user/profile-nav";
import {useSelector} from "react-redux";
import {RootState} from "@/src/store/store";
import {useParams} from "next/navigation";
import {ReactNode} from "react";
import {ProfileSidebar} from "@/src/components/user/profile-sidebar";
import PostList from "@/src/components/post/PostList";

export default function ClientLayout({ children }: { children: ReactNode }) {
    const params = useParams()
    const auth = useSelector((state: RootState) => state.auth)
    const isOwner = auth.user?.id === params.userId
    return (
        <div className="min-h-screen bg-gray-100">
            <ProfileHeader username={auth?.user?.username}/>
            <ProfileNav isOwner={isOwner} />
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
