import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedServerApi } from "@/src/lib/auth-server-api";

export async function PATCH(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();

        const formData = await request.formData();

        const file = formData.get("file");
        if (!file) {
            return NextResponse.json(
                { message: "Image file is required" },
                { status: 400 }
            );
        }

        // Forward form-data sang NestJS: /users/me/avatar
        const response = await api.patch(`/users/me/avatar`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(
            "BFF /api/user/me/avatar PATCH error:",
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
                    "Update user avatar request failed",
            },
            { status: error?.response?.status || 500 }
        );
    }
}
