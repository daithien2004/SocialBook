import serverApi from "@/lib/server-api";
import { extractResponseDtoData } from "@/lib/response-dto";
import type { ResponseDto } from "@/types/response";

export async function userServerApi(){
    return {
        async getIsUserExist(userId: string): Promise<boolean> {
            try {
                const res = await serverApi.get<ResponseDto<boolean>>(`/users/${userId}/exist`);
                return extractResponseDtoData(res.data) ?? false;
            } catch (err: unknown) {
                console.log("getIsUserExist error:", err);
                return false;
            }
        },
    };
}
