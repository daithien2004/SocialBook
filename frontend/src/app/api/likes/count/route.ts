import {NESTJS_LIKES_ENDPOINTS} from "@/src/constants/server-endpoints";
import {NextRequest, NextResponse} from "next/server";
import serverApi from "@/src/lib/server-api";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const targetId = searchParams.get('targetId');
        const targetType = searchParams.get('targetType');
        const response = await serverApi.get(
            NESTJS_LIKES_ENDPOINTS.getCount,
            {
                params: {
                    targetId,
                    targetType
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/likes/count GET error:', error?.response?.data || error);

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
