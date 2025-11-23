import { NextRequest, NextResponse } from "next/server";
import serverApi from "@/src/lib/server-api";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const response = await serverApi.get(`/users/${id}/overview`);

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(
            "BFF /api/user/[id]/overview GET error:",
            error?.response?.data || error
        );

        if (error instanceof Error && error.message.startsWith("Unauthorized")) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }

        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    "Get user overview request failed",
            },
            { status: error?.response?.status || 500 }
        );
    }
}
