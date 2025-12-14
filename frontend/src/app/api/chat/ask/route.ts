
import { NESTJS_CHROMA_ENDPOINTS } from "@/src/constants/server-endpoints";
import { getAuthenticatedServerApi } from "@/src/lib/auth-server-api";
import serverApi from "@/src/lib/server-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const authenticatedApi = await getAuthenticatedServerApi();


        const body = await request.json();
        const response = await authenticatedApi.post(NESTJS_CHROMA_ENDPOINTS.askChatbot, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to fetch books',
                error: error.response?.data?.error || 'Internal Server Error',
            },
            { status: error.response?.status || 500 }
        );
    }
}