import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_COMMENTS_ENDPOINTS } from "@/src/constants/server-endpoints";
import {getAuthenticatedServerApi} from "@/src/lib/auth-server-api";

export async function GET(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();

        const { searchParams } = new URL(request.url);

        const targetId = searchParams.get('targetId');
        const parentId = searchParams.get('parentId');
        const cursor = searchParams.get('cursor') || undefined;
        const limit = searchParams.get('limit');

        const response = await api.get(
            NESTJS_COMMENTS_ENDPOINTS.getCommentsByTarget,
            {
                params: {
                    targetId,
                    parentId,
                    cursor,
                    limit: Number(limit),
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/comments error:', error?.response?.data || error);

        // 🛡 5. Nếu là lỗi “Unauthorized” từ helper → trả 401
        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { message: error.message },
                { status: 401 },
            );
        }

        // các lỗi khác (NestJS trả về lỗi, network lỗi, v.v.)
        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    'Get comments request failed',
            },
            { status: error?.response?.status || 500 },
        );
    }
}
