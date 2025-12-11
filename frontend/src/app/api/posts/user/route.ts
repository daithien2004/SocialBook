import {NextRequest, NextResponse} from "next/server";
import {NESTJS_POSTS_ENDPOINTS} from "@/src/constants/server-endpoints";
import {getAuthenticatedServerApi} from "@/src/lib/auth-server-api";

export async function GET(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();
        const searchParams = request.nextUrl.searchParams;

        const userId = searchParams.get('userId');
        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '10';

        const response = await api.get(NESTJS_POSTS_ENDPOINTS.getAllByUsers, {
            params:  {userId, page, limit },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message:
                    error.response?.data?.message || 'Lỗi khi lấy danh sách bài viết của tôi',
                error: error?.message || error,
            },
            { status: error.response?.status || 500 }
        );
    }
}