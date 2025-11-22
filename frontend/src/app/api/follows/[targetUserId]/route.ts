// src/app/api/follows/[targetUserId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedServerApi } from "@/src/lib/auth-server-api";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ targetUserId: string }> }
) {
    try {
        const { targetUserId } = await params;

        const api = await getAuthenticatedServerApi();
        const response = await api.get(`follows/${targetUserId}`);
        return NextResponse.json(response.data);
    } catch (error) {
        console.error("GET /api/follows/[targetUserId] error:", error);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

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
        console.error("POST /api/follows/[targetUserId] error:", error);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}
