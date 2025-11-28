// src/app/api/follows/[targetUserId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedServerApi } from "@/src/lib/auth-server-api";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ targetUserId: string }> }
) {
    try {
        const { targetUserId } = await params;

        const api = await getAuthenticatedServerApi();
        const response = await api.post(`follows/${targetUserId}`);
        return NextResponse.json(response.data);
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        console.error('Unexpected error in /api/follows/[targetUserId]', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
