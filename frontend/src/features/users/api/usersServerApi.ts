import serverApi from "@/lib/server-api";

export async function userServerApi(){
    return {
        async getIsUserExist(userId: string): Promise<boolean> {
            try {
                const res = await serverApi.get(`/users/${userId}/exist`);
                return res.data?.data ?? null;
            } catch (err: any) {
                console.log("getIsUserExist error:", err?.response?.data || err);
                return false;
            }
        },
    };
}