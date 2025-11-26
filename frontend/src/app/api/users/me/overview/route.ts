import { NextRequest, NextResponse } from "next/server";
import {getAuthenticatedServerApi} from "@/src/lib/auth-server-api";

export async function PATCH(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();
        const body = await request.json();
        const response = await api.patch(`/users/me/overview`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(
            "BFF /api/user/me/overview PATCH error:",
            error?.response?.data || error
        );

        if (error?.response?.status === 401) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    "Update user overview request failed",
            },
            { status: error?.response?.status || 500 }
        );
    }
}
