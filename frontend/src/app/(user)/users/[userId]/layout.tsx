import ClientLayout from "./ClientLayout";
import { ReactNode } from "react";
import type { FollowStateResponse } from "@/src/features/follows/api/followApi";
import {followServerApi} from "@/src/features/follows/api/followServerApi";
import Link from "next/link";


export default async function UserLayout(
    {children, params,}:
    { children: ReactNode; params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;

    let initialFollowState: FollowStateResponse | null = null;

    try {
        const followApi = await followServerApi();
        initialFollowState = await followApi.getFollowState(userId);
    } catch (error) {
        console.error("SSR follow state error:", error);
    }
    if (!initialFollowState) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Không tìm thấy người dùng
                    </h1>
                    <p className="text-gray-600">
                        Người dùng không tồn tại hoặc đã bị xóa.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <ClientLayout
            profileUserId={userId}
            initialFollowState={initialFollowState}>
            {children}
        </ClientLayout>
    );
}
