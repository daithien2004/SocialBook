// src/app/(user)/users/[userId]/layout.tsx
import ClientLayout from "./ClientLayout";
import { ReactNode } from "react";
import type { FollowStateResponse } from "@/src/features/follows/api/followApi";
import {followServerApi} from "@/src/features/follows/api/followServerApi";

export default async function UserLayout(
    {children, params,}:
    { children: ReactNode; params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;

    let initialFollowState: FollowStateResponse | null = null;

    try {
        const followApi = await followServerApi();
        initialFollowState = await followApi.getFollowState(userId);
        console.log("SSR initialFollowState:", initialFollowState);
    } catch (error) {
        console.error("SSR follow state error:", error);
    }

    return (
        <ClientLayout
            profileUserId={userId}
            initialFollowState={initialFollowState}>
            {children}
        </ClientLayout>
    );
}
