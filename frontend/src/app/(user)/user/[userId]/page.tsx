"use client"

import { ProfileSidebar } from "@/src/components/user/profile-sidebar"
import { ReadingLists } from "@/src/components/user/reading-lists"

export default function ProfilePage() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-6">
                <ProfileSidebar />
            </div>
            <div className="lg:col-span-8">
                <ReadingLists />
            </div>
        </div>
    )
}
