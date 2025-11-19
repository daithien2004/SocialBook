import {NESTJS_LIKES_ENDPOINTS} from "@/src/constants/server-endpoints";
import {getAuthenticatedServerApi} from "@/src/lib/auth-server-api";
import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();
        const body = await request.json();
        const { targetId, targetType } = body;
        const response = await api.post(
            NESTJS_LIKES_ENDPOINTS.postToggleLike,
            { targetId, targetType }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/likes/toggle POST error:', error?.response?.data || error);

        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }

        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    'Like comment request failed',
            },
            { status: error?.response?.status || 500 },
        );
    }
}
