import { getAuthenticatedServerApi } from "@/lib/auth-server-api";
import type { FollowStateResponse } from "@/features/follows/api/followApi";
import { extractResponseDtoData } from "@/lib/response-dto";
import type { ResponseDto } from "@/types/response";

export async function followServerApi() {
    const api = await getAuthenticatedServerApi();

    return {
        async getFollowState(targetUserId: string): Promise<FollowStateResponse | null> {
            try {
                const res = await api.get<ResponseDto<FollowStateResponse>>(`/follows/status?targetId=${targetUserId}`);
                return extractResponseDtoData(res.data);
            } catch (err: unknown) {
                console.log("getFollowState error:", err);
                return null;
            }
        },
    };
}
