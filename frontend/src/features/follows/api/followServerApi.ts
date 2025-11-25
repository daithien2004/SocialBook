import { getAuthenticatedServerApi } from "@/src/lib/auth-server-api";
import type { FollowStateResponse } from "@/src/features/follows/api/followApi";

export async function followServerApi() {
    const api = await getAuthenticatedServerApi();

    return {
        async getFollowState(targetUserId: string): Promise<FollowStateResponse | null> {
            try {
                const res = await api.get(`/follows/${targetUserId}`);
                return res.data?.data ?? null;
            } catch (err: any) {
                console.log("getFollowState error:", err?.response?.data || err);
                return null;
            }
        },
        async toggleFollow(targetUserId: string): Promise<FollowStateResponse | null> {
            const res = await api.post(`/follows/${targetUserId}`);
            return (res.data?.data ?? null) as FollowStateResponse | null;
        },
    };
}