import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_COMMENTS_ENDPOINTS } from "@/src/constants/server-endpoints";
import {getAuthenticatedServerApi} from "@/src/lib/auth-server-api";

export async function GET(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();

        const { searchParams } = new URL(request.url);

        const targetId = searchParams.get('targetId');
        const parentId = searchParams.get('parentId');
        const targetType = searchParams.get('targetType');

        const response = await api.get(
            NESTJS_COMMENTS_ENDPOINTS.getResolveParent,
            {
                params: {
                    targetId,
                    parentId,
                    targetType
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/resolve-parent GET error:', error?.response?.data || error);

        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }

        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    'Create comment request failed',
            },
            { status: error?.response?.status || 500 },
        );
    }
}
